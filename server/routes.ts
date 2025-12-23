import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";
import { stripeService } from "./stripeService";
import { pool } from "./db";
import { logger } from "./logger";
import { getStripePublishableKey, getUncachableStripeClient } from "./stripeClient";
import { isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  insertContactSchema,
  insertCompanySchema,
  insertDealSchema,
  insertNoteSchema,
  insertTaskSchema,
  insertTagSchema,
  insertActivitySchema,
  insertEmailAccountSchema,
  insertEmailTemplateSchema,
  insertScheduledEmailSchema,
} from "@shared/schema";
import { z } from "zod";

// UAT Mode - Set to true to bypass authentication for testing
const UAT_MODE = false;
const UAT_USER_ID = "uat-test-user";

// Helper to check if user is authenticated (respects UAT mode)
function isUserAuthenticated(req: Request): boolean {
  if (UAT_MODE) {
    return true;
  }
  return !!req.user;
}

// Helper to extract user ID from session claims
function getUserId(req: Request): string | null {
  // In UAT mode, always return the test user ID
  if (UAT_MODE) {
    return UAT_USER_ID;
  }
  const user = req.user as any;
  return user?.claims?.sub || null;
}

// Middleware to check if user has active subscription or trial (for write operations)
const TRIAL_DAYS = 7;

async function requireActiveAccess(req: Request, res: any, next: any) {
  // In UAT mode, bypass all access checks
  if (UAT_MODE) {
    return next();
  }
  
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await stripeService.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user has active subscription, allow access
    if (user.stripeSubscriptionId) {
      return next();
    }

    // Check if trial is still active
    const now = new Date();
    const createdAt = user.createdAt ? new Date(user.createdAt) : now;
    const trialEndDate = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const isTrialActive = trialEndDate > now;

    if (isTrialActive) {
      return next();
    }

    // Trial expired and no subscription - read-only mode
    return res.status(403).json({ 
      error: "Your free trial has ended. Please subscribe to add, edit, or delete data.",
      code: "TRIAL_EXPIRED"
    });
  } catch (error) {
    console.error("Error checking access:", error);
    return res.status(500).json({ error: "Failed to verify access" });
  }
}

const updateContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  status: z.string().optional(),
  linkedinUrl: z.string().nullable().optional(),
  facebookUrl: z.string().nullable().optional(),
  whatsappNumber: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().optional(),
  domain: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
});

const updateDealSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
  stage: z.string().optional(),
  probability: z.number().nullable().optional(),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
});

const updateNoteSchema = z.object({
  content: z.string().optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  completed: z.string().optional(),
  priority: z.string().optional(),
  contactId: z.string().nullable().optional(),
  companyId: z.string().nullable().optional(),
  dealId: z.string().nullable().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);
  
  // Get current user info
  app.get("/api/me", async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(data);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = updateContactSchema.parse(req.body);
      const contact = await storage.updateContact(req.params.id, data);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(data);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = updateCompanySchema.parse(req.body);
      const company = await storage.updateCompany(req.params.id, data);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ error: "Failed to fetch deal" });
    }
  });

  app.post("/api/deals", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(data);
      res.status(201).json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating deal:", error);
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = updateDealSchema.parse(req.body);
      const deal = await storage.updateDeal(req.params.id, data);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating deal:", error);
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.deleteDeal(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  app.get("/api/notes", async (req, res) => {
    try {
      const { contactId, companyId, dealId } = req.query;
      let notes;
      if (typeof contactId === "string") {
        notes = await storage.getNotesByContact(contactId);
      } else if (typeof companyId === "string") {
        notes = await storage.getNotesByCompany(companyId);
      } else if (typeof dealId === "string") {
        notes = await storage.getNotesByDeal(dealId);
      } else {
        notes = await storage.getNotes();
      }
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ error: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(data);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = updateNoteSchema.parse(req.body);
      const note = await storage.updateNote(req.params.id, data);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.deleteNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  app.get("/api/tasks", async (req, res) => {
    try {
      const { contactId, companyId, dealId } = req.query;
      let tasks;
      if (typeof contactId === "string") {
        tasks = await storage.getTasksByContact(contactId);
      } else if (typeof companyId === "string") {
        tasks = await storage.getTasksByCompany(companyId);
      } else if (typeof dealId === "string") {
        tasks = await storage.getTasksByDeal(dealId);
      } else {
        tasks = await storage.getTasks();
      }
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = updateTaskSchema.parse(req.body);
      const task = await storage.updateTask(req.params.id, data);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Tags routes
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(data);
      res.status(201).json(tag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ error: "Failed to create tag" });
    }
  });

  app.delete("/api/tags/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.deleteTag(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ error: "Failed to delete tag" });
    }
  });

  // Contact tags routes
  app.get("/api/contacts/:contactId/tags", async (req, res) => {
    try {
      const tags = await storage.getContactTags(req.params.contactId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching contact tags:", error);
      res.status(500).json({ error: "Failed to fetch contact tags" });
    }
  });

  app.post("/api/contacts/:contactId/tags/:tagId", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const contactTag = await storage.addTagToContact(req.params.contactId, req.params.tagId);
      res.status(201).json(contactTag);
    } catch (error) {
      console.error("Error adding tag to contact:", error);
      res.status(500).json({ error: "Failed to add tag to contact" });
    }
  });

  app.delete("/api/contacts/:contactId/tags/:tagId", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      await storage.removeTagFromContact(req.params.contactId, req.params.tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing tag from contact:", error);
      res.status(500).json({ error: "Failed to remove tag from contact" });
    }
  });

  // Activities routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { contactId, companyId, dealId } = req.query;
      let activities;
      if (typeof contactId === "string") {
        activities = await storage.getActivitiesByContact(contactId);
      } else if (typeof companyId === "string") {
        activities = await storage.getActivitiesByCompany(companyId);
      } else if (typeof dealId === "string") {
        activities = await storage.getActivitiesByDeal(dealId);
      } else {
        activities = await storage.getActivities();
      }
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(data);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  });

  // Helper to sanitize email account (remove sensitive tokens)
  const sanitizeEmailAccount = (account: any) => ({
    id: account.id,
    userId: account.userId,
    provider: account.provider,
    email: account.email,
    isDefault: account.isDefault,
    createdAt: account.createdAt,
  });

  // Email accounts routes
  app.get("/api/email-accounts", async (req, res) => {
    try {
      if (!isUserAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const accounts = await storage.getEmailAccounts(getUserId(req)!);
      res.json(accounts.map(sanitizeEmailAccount));
    } catch (error) {
      console.error("Error fetching email accounts:", error);
      res.status(500).json({ error: "Failed to fetch email accounts" });
    }
  });

  app.get("/api/email-accounts/:id", async (req, res) => {
    try {
      if (!isUserAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const account = await storage.getEmailAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Email account not found" });
      }
      if (account.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(sanitizeEmailAccount(account));
    } catch (error) {
      console.error("Error fetching email account:", error);
      res.status(500).json({ error: "Failed to fetch email account" });
    }
  });

  app.post("/api/email-accounts", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertEmailAccountSchema.parse({
        ...req.body,
        userId: getUserId(req)!,
      });
      const account = await storage.createEmailAccount(data);
      res.status(201).json(sanitizeEmailAccount(account));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating email account:", error);
      res.status(500).json({ error: "Failed to create email account" });
    }
  });

  app.delete("/api/email-accounts/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const account = await storage.getEmailAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ error: "Email account not found" });
      }
      if (account.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await storage.deleteEmailAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting email account:", error);
      res.status(500).json({ error: "Failed to delete email account" });
    }
  });

  // Email templates routes
  app.get("/api/email-templates", async (req, res) => {
    try {
      if (!isUserAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const templates = await storage.getEmailTemplates(getUserId(req)!);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ error: "Failed to fetch email templates" });
    }
  });

  app.get("/api/email-templates/:id", async (req, res) => {
    try {
      if (!isUserAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Email template not found" });
      }
      if (template.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ error: "Failed to fetch email template" });
    }
  });

  app.post("/api/email-templates", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertEmailTemplateSchema.parse({
        ...req.body,
        userId: getUserId(req)!,
      });
      const template = await storage.createEmailTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating email template:", error);
      res.status(500).json({ error: "Failed to create email template" });
    }
  });

  app.patch("/api/email-templates/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const existing = await storage.getEmailTemplate(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Email template not found" });
      }
      if (existing.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const template = await storage.updateEmailTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ error: "Failed to update email template" });
    }
  });

  app.delete("/api/email-templates/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const template = await storage.getEmailTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Email template not found" });
      }
      if (template.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await storage.deleteEmailTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ error: "Failed to delete email template" });
    }
  });

  // Scheduled emails routes
  app.get("/api/scheduled-emails", async (req, res) => {
    try {
      if (!isUserAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const emails = await storage.getScheduledEmails(getUserId(req)!);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching scheduled emails:", error);
      res.status(500).json({ error: "Failed to fetch scheduled emails" });
    }
  });

  app.get("/api/scheduled-emails/:id", async (req, res) => {
    try {
      if (!isUserAuthenticated(req)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const email = await storage.getScheduledEmail(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Scheduled email not found" });
      }
      if (email.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(email);
    } catch (error) {
      console.error("Error fetching scheduled email:", error);
      res.status(500).json({ error: "Failed to fetch scheduled email" });
    }
  });

  app.post("/api/scheduled-emails", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const data = insertScheduledEmailSchema.parse({
        ...req.body,
        userId: getUserId(req)!,
      });
      const email = await storage.createScheduledEmail(data);
      res.status(201).json(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating scheduled email:", error);
      res.status(500).json({ error: "Failed to create scheduled email" });
    }
  });

  app.patch("/api/scheduled-emails/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const existing = await storage.getScheduledEmail(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Scheduled email not found" });
      }
      if (existing.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const email = await storage.updateScheduledEmail(req.params.id, req.body);
      res.json(email);
    } catch (error) {
      console.error("Error updating scheduled email:", error);
      res.status(500).json({ error: "Failed to update scheduled email" });
    }
  });

  app.delete("/api/scheduled-emails/:id", isAuthenticated, requireActiveAccess, async (req, res) => {
    try {
      const email = await storage.getScheduledEmail(req.params.id);
      if (!email) {
        return res.status(404).json({ error: "Scheduled email not found" });
      }
      if (email.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await storage.deleteScheduledEmail(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scheduled email:", error);
      res.status(500).json({ error: "Failed to delete scheduled email" });
    }
  });

  // Get webhook base URL for integrations
  app.get("/api/integrations/webhook-base-url", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Use env variable if configured, otherwise derive from trusted headers
      const configuredUrl = process.env.APP_BASE_URL || process.env.REPLIT_DEPLOYMENT_URL;
      
      if (configuredUrl) {
        return res.json({ baseUrl: configuredUrl.replace(/\/$/, '') });
      }
      
      // Fallback to request headers with validation
      const host = req.headers['host'] || '';
      
      // Only trust headers for Replit domains
      const isTrustedHost = host.endsWith('.replit.app') || 
                            host.endsWith('.replit.dev') || 
                            host.endsWith('.repl.co') ||
                            host.includes('localhost');
      
      if (!isTrustedHost) {
        return res.json({ baseUrl: '' });
      }
      
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;
      res.json({ baseUrl });
    } catch (error) {
      console.error("Error getting webhook base URL:", error);
      res.status(500).json({ error: "Failed to get webhook base URL" });
    }
  });

  // Integration Accounts - with Zod validation and secure field handling
  const createIntegrationSchema = z.object({
    platform: z.enum(["whatsapp", "linkedin", "facebook"]),
    accountName: z.string().optional(),
  }).strict();

  const updateIntegrationSchema = z.object({
    accountName: z.string().optional(),
  }).strict();

  app.get("/api/integrations", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const integrations = await storage.getIntegrationAccounts(getUserId(req)!);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const parsed = createIntegrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request: " + parsed.error.message });
      }
      
      const existing = await storage.getIntegrationAccountByPlatform(getUserId(req)!, parsed.data.platform);
      if (existing) {
        return res.status(400).json({ error: "Integration for this platform already exists" });
      }
      
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      const integration = await storage.createIntegrationAccount({
        platform: parsed.data.platform,
        accountName: parsed.data.accountName || null,
        userId: getUserId(req)!,
        webhookSecret,
        isActive: "true",
      });
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ error: "Failed to create integration" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const parsed = updateIntegrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request: " + parsed.error.message });
      }
      
      const existing = await storage.getIntegrationAccount(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Integration not found" });
      }
      if (existing.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const integration = await storage.updateIntegrationAccount(req.params.id, parsed.data);
      res.json(integration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ error: "Failed to update integration" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const integration = await storage.getIntegrationAccount(req.params.id);
      if (!integration) {
        return res.status(404).json({ error: "Integration not found" });
      }
      if (integration.userId !== getUserId(req)!) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await storage.deleteIntegrationAccount(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ error: "Failed to delete integration" });
    }
  });

  // Google Calendar API endpoints
  app.get("/api/calendar/status", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { isGoogleCalendarConnected } = await import("./googleCalendar");
      const connected = await isGoogleCalendarConnected();
      res.json({ connected });
    } catch (error) {
      console.error("Error checking calendar status:", error);
      res.json({ connected: false });
    }
  });

  app.get("/api/calendar/events", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { listCalendarEvents } = await import("./googleCalendar");
      
      const timeMin = req.query.timeMin ? new Date(req.query.timeMin as string) : undefined;
      const timeMax = req.query.timeMax ? new Date(req.query.timeMax as string) : undefined;
      
      const events = await listCalendarEvents(timeMin, timeMax);
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ error: "Google Calendar not connected" });
      }
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar/events", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { createCalendarEvent } = await import("./googleCalendar");
      
      const eventSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        start: z.string(),
        end: z.string(),
        allDay: z.boolean().optional(),
        location: z.string().optional(),
      });
      
      const parsed = eventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid event data" });
      }
      
      const event = await createCalendarEvent(parsed.data);
      res.json(event);
    } catch (error: any) {
      console.error("Error creating calendar event:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ error: "Google Calendar not connected" });
      }
      res.status(500).json({ error: "Failed to create calendar event" });
    }
  });

  app.delete("/api/calendar/events/:eventId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { deleteCalendarEvent } = await import("./googleCalendar");
      await deleteCalendarEvent(req.params.eventId);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting calendar event:", error);
      if (error.message?.includes("not connected")) {
        return res.status(400).json({ error: "Google Calendar not connected" });
      }
      res.status(500).json({ error: "Failed to delete calendar event" });
    }
  });

  // Webhook endpoint for receiving contacts from integrations (e.g., Zapier, Make)
  app.post("/api/webhook/contacts/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { webhookSecret } = req.query;
      
      if (!webhookSecret || typeof webhookSecret !== 'string') {
        return res.status(401).json({ error: "Missing webhook secret" });
      }

      // Find the integration by webhook secret
      const integration = await storage.getIntegrationAccountByWebhookSecret(platform, webhookSecret);

      if (!integration) {
        return res.status(401).json({ error: "Invalid webhook secret" });
      }

      // Process incoming contacts
      const contacts = Array.isArray(req.body) ? req.body : [req.body];
      let importedCount = 0;

      for (const contactData of contacts) {
        try {
          await storage.createContact({
            firstName: contactData.firstName || contactData.first_name || contactData.name?.split(' ')[0] || 'Unknown',
            lastName: contactData.lastName || contactData.last_name || contactData.name?.split(' ').slice(1).join(' ') || '',
            email: contactData.email || `imported-${Date.now()}@placeholder.local`,
            phone: contactData.phone || contactData.phoneNumber || contactData.whatsapp || null,
            status: 'lead',
            linkedinUrl: contactData.linkedinUrl || contactData.linkedin || null,
            facebookUrl: contactData.facebookUrl || contactData.facebook || null,
            whatsappNumber: contactData.whatsappNumber || contactData.whatsapp || contactData.phone || null,
          });
          importedCount++;
        } catch (e) {
          console.error("Error importing contact:", e);
        }
      }

      // Update integration stats
      await storage.updateIntegrationAccount(integration.id, {
        lastSyncAt: new Date(),
        contactsImported: (integration.contactsImported || 0) + importedCount,
      });

      res.json({ success: true, imported: importedCount });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // ============== BILLING ROUTES ==============

  // Get Stripe publishable key (requires auth)
  app.get("/api/billing/config", isAuthenticated, async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ error: "Failed to get billing configuration" });
    }
  });

  // Get products with prices (requires auth) - fetches directly from Stripe
  app.get("/api/billing/products", isAuthenticated, async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      
      // Fetch active products directly from Stripe
      const products = await stripe.products.list({ active: true, limit: 10 });
      
      const productsWithPrices = await Promise.all(
        products.data.map(async (product) => {
          const prices = await stripe.prices.list({ 
            product: product.id, 
            active: true,
            limit: 5 
          });
          
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            active: product.active,
            metadata: product.metadata,
            prices: prices.data.map(price => ({
              id: price.id,
              unit_amount: price.unit_amount,
              currency: price.currency,
              recurring: price.recurring,
              active: price.active,
            }))
          };
        })
      );

      res.json({ data: productsWithPrices });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get user subscription status (requires auth)
  app.get("/api/billing/subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const subscription = await stripeService.getSubscription(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  // Get trial status (requires auth)
  app.get("/api/billing/trial", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const TRIAL_DAYS = 7;
      const now = new Date();
      const createdAt = user.createdAt ? new Date(user.createdAt) : now;
      const trialEndDate = new Date(createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      const isTrialActive = daysLeft > 0 && !user.stripeSubscriptionId;

      res.json({
        isTrialActive,
        daysLeft,
        trialEndDate: trialEndDate.toISOString(),
        hasSubscription: !!user.stripeSubscriptionId,
      });
    } catch (error) {
      console.error("Error fetching trial status:", error);
      res.status(500).json({ error: "Failed to fetch trial status" });
    }
  });

  // Create checkout session (requires auth)
  app.post("/api/billing/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const user = await stripeService.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(
          user.email || '',
          user.id,
          `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
        );
        await stripeService.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/billing?success=true`,
        `${baseUrl}/billing?canceled=true`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Create customer portal session (requires auth)
  app.post("/api/billing/portal", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No billing account found" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/billing`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  // Developer-only endpoints
  const DEVELOPER_EMAIL = "adamsahime1998@gmail.com";

  // Get logs (developer only)
  app.get("/api/developer/logs", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user || user.email !== DEVELOPER_EMAIL) {
        return res.status(403).json({ error: "Access denied. Developer only." });
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const level = req.query.level as string | undefined;
      
      const logs = await storage.getLogs(limit, level);
      const stats = await storage.getLogStats();
      
      res.json({ logs, stats });
    } catch (error: any) {
      console.error("Logs fetch error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch logs" });
    }
  });

  // Clear logs (developer only)
  app.delete("/api/developer/logs", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user || user.email !== DEVELOPER_EMAIL) {
        return res.status(403).json({ error: "Access denied. Developer only." });
      }

      await storage.clearLogs();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Clear logs error:", error);
      res.status(500).json({ error: error.message || "Failed to clear logs" });
    }
  });

  // Get database schema info
  app.get("/api/developer/schema", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user || user.email !== DEVELOPER_EMAIL) {
        return res.status(403).json({ error: "Access denied. Developer only." });
      }

      // Get all tables
      const tablesResult = await pool.query(`
        SELECT table_name, table_schema, table_type
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);

      // Get all columns for each table
      const columnsResult = await pool.query(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);

      // Get primary keys
      const primaryKeysResult = await pool.query(`
        SELECT 
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = 'public'
      `);

      // Get foreign keys
      const foreignKeysResult = await pool.query(`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
      `);

      // Get row counts for each table
      const rowCountsResult = await pool.query(`
        SELECT relname as table_name, n_live_tup as row_count
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
      `);

      const primaryKeys = new Map<string, Set<string>>();
      primaryKeysResult.rows.forEach(row => {
        if (!primaryKeys.has(row.table_name)) {
          primaryKeys.set(row.table_name, new Set());
        }
        primaryKeys.get(row.table_name)!.add(row.column_name);
      });

      const foreignKeys = new Map<string, Map<string, { table: string; column: string }>>();
      foreignKeysResult.rows.forEach(row => {
        if (!foreignKeys.has(row.table_name)) {
          foreignKeys.set(row.table_name, new Map());
        }
        foreignKeys.get(row.table_name)!.set(row.column_name, {
          table: row.foreign_table_name,
          column: row.foreign_column_name,
        });
      });

      const rowCounts = new Map<string, number>();
      rowCountsResult.rows.forEach(row => {
        rowCounts.set(row.table_name, parseInt(row.row_count) || 0);
      });

      // Group columns by table
      const tables = tablesResult.rows.map(table => {
        const tableColumns = columnsResult.rows
          .filter(col => col.table_name === table.table_name)
          .map(col => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
            maxLength: col.character_maximum_length,
            precision: col.numeric_precision,
            isPrimaryKey: primaryKeys.get(table.table_name)?.has(col.column_name) || false,
            foreignKey: foreignKeys.get(table.table_name)?.get(col.column_name) || null,
          }));

        return {
          name: table.table_name,
          schema: table.table_schema,
          type: table.table_type,
          columns: tableColumns,
          rowCount: rowCounts.get(table.table_name) || 0,
        };
      });

      res.json({ tables });
    } catch (error: any) {
      console.error("Schema fetch error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch schema" });
    }
  });

  // SQL query endpoint  
  app.post("/api/developer/sql", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await stripeService.getUser(userId);
      if (!user || user.email !== DEVELOPER_EMAIL) {
        return res.status(403).json({ error: "Access denied. Developer only." });
      }

      const { query } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query is required" });
      }

      // Execute the SQL query
      const result = await pool.query(query);
      
      res.json({
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
      });
    } catch (error: any) {
      console.error("SQL query error:", error);
      res.status(400).json({ 
        error: error.message || "Failed to execute query",
        detail: error.detail,
        hint: error.hint,
      });
    }
  });

  // Global error handler that logs errors
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const userId = getUserId(req);
    logger.error(err.message, {
      source: `${req.method} ${req.path}`,
      userId: userId || undefined,
      metadata: { 
        method: req.method,
        path: req.path,
        query: req.query,
      },
    }, err);
    
    res.status(500).json({ error: "Internal server error" });
  });

  return httpServer;
}
