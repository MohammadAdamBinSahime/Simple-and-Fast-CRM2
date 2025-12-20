import {
  properties,
  contacts,
  companies,
  deals,
  notes,
  tasks,
  tags,
  contactTags,
  activities,
  emailAccounts,
  emailTemplates,
  scheduledEmails,
  type Property,
  type InsertProperty,
  type Contact,
  type InsertContact,
  type Company,
  type InsertCompany,
  type Deal,
  type InsertDeal,
  type Note,
  type InsertNote,
  type Task,
  type InsertTask,
  type Tag,
  type InsertTag,
  type ContactTag,
  type InsertContactTag,
  type Activity,
  type InsertActivity,
  type EmailAccount,
  type InsertEmailAccount,
  type EmailTemplate,
  type InsertEmailTemplate,
  type ScheduledEmail,
  type InsertScheduledEmail,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

function filterUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  ) as Partial<T>;
}

export interface IStorage {
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;

  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  getDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;

  getNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  getNotesByContact(contactId: string): Promise<Note[]>;
  getNotesByCompany(companyId: string): Promise<Note[]>;
  getNotesByDeal(dealId: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByContact(contactId: string): Promise<Task[]>;
  getTasksByCompany(companyId: string): Promise<Task[]>;
  getTasksByDeal(dealId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  getDashboardMetrics(): Promise<{
    totalContacts: number;
    totalCompanies: number;
    totalDeals: number;
    totalTasks: number;
    pipelineValue: number;
    wonDeals: number;
  }>;

  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  deleteTag(id: string): Promise<boolean>;

  getContactTags(contactId: string): Promise<Tag[]>;
  addTagToContact(contactId: string, tagId: string): Promise<ContactTag>;
  removeTagFromContact(contactId: string, tagId: string): Promise<boolean>;

  getActivities(): Promise<Activity[]>;
  getActivitiesByContact(contactId: string): Promise<Activity[]>;
  getActivitiesByCompany(companyId: string): Promise<Activity[]>;
  getActivitiesByDeal(dealId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  getEmailAccounts(userId: string): Promise<EmailAccount[]>;
  getEmailAccount(id: string): Promise<EmailAccount | undefined>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: string, account: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined>;
  deleteEmailAccount(id: string): Promise<boolean>;

  getEmailTemplates(userId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;

  getScheduledEmails(userId: string): Promise<ScheduledEmail[]>;
  getScheduledEmail(id: string): Promise<ScheduledEmail | undefined>;
  getPendingScheduledEmails(): Promise<ScheduledEmail[]>;
  createScheduledEmail(email: InsertScheduledEmail): Promise<ScheduledEmail>;
  updateScheduledEmail(id: string, email: Partial<InsertScheduledEmail>): Promise<ScheduledEmail | undefined>;
  deleteScheduledEmail(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getProperties(): Promise<Property[]> {
    return db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const filtered = filterUndefined(property);
    if (Object.keys(filtered).length === 0) {
      return this.getProperty(id);
    }
    const [updated] = await db.update(properties).set(filtered).where(eq(properties.id, id)).returning();
    return updated || undefined;
  }

  async deleteProperty(id: string): Promise<boolean> {
    await db.delete(properties).where(eq(properties.id, id));
    return true;
  }

  async getContacts(): Promise<Contact[]> {
    return db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const filtered = filterUndefined(contact);
    if (Object.keys(filtered).length === 0) {
      return this.getContact(id);
    }
    const [updated] = await db.update(contacts).set(filtered).where(eq(contacts.id, id)).returning();
    return updated || undefined;
  }

  async deleteContact(id: string): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }

  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const filtered = filterUndefined(company);
    if (Object.keys(filtered).length === 0) {
      return this.getCompany(id);
    }
    const [updated] = await db.update(companies).set(filtered).where(eq(companies.id, id)).returning();
    return updated || undefined;
  }

  async deleteCompany(id: string): Promise<boolean> {
    await db.delete(companies).where(eq(companies.id, id));
    return true;
  }

  async getDeals(): Promise<Deal[]> {
    return db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal || undefined;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal | undefined> {
    const filtered = filterUndefined(deal);
    if (Object.keys(filtered).length === 0) {
      return this.getDeal(id);
    }
    const [updated] = await db.update(deals).set(filtered).where(eq(deals.id, id)).returning();
    return updated || undefined;
  }

  async deleteDeal(id: string): Promise<boolean> {
    await db.delete(deals).where(eq(deals.id, id));
    return true;
  }

  async getNotes(): Promise<Note[]> {
    return db.select().from(notes).orderBy(desc(notes.createdAt));
  }

  async getNote(id: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note || undefined;
  }

  async getNotesByContact(contactId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.contactId, contactId)).orderBy(desc(notes.createdAt));
  }

  async getNotesByCompany(companyId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.companyId, companyId)).orderBy(desc(notes.createdAt));
  }

  async getNotesByDeal(dealId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.dealId, dealId)).orderBy(desc(notes.createdAt));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const filtered = filterUndefined(note);
    if (Object.keys(filtered).length === 0) {
      return this.getNote(id);
    }
    const [updated] = await db.update(notes).set(filtered).where(eq(notes.id, id)).returning();
    return updated || undefined;
  }

  async deleteNote(id: string): Promise<boolean> {
    await db.delete(notes).where(eq(notes.id, id));
    return true;
  }

  async getTasks(): Promise<Task[]> {
    return db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByContact(contactId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.contactId, contactId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByCompany(companyId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.companyId, companyId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByDeal(dealId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.dealId, dealId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const filtered = filterUndefined(task);
    if (Object.keys(filtered).length === 0) {
      return this.getTask(id);
    }
    const [updated] = await db.update(tasks).set(filtered).where(eq(tasks.id, id)).returning();
    return updated || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }

  async getDashboardMetrics() {
    const [contactCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts);
    const [companyCount] = await db.select({ count: sql<number>`count(*)` }).from(companies);
    const [dealCount] = await db.select({ count: sql<number>`count(*)` }).from(deals);
    const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks);
    
    const [pipelineResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(value AS DECIMAL)), 0)` })
      .from(deals)
      .where(sql`stage NOT IN ('closed_won', 'closed_lost')`);
    
    const [wonResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(eq(deals.stage, "closed_won"));

    return {
      totalContacts: Number(contactCount?.count ?? 0),
      totalCompanies: Number(companyCount?.count ?? 0),
      totalDeals: Number(dealCount?.count ?? 0),
      totalTasks: Number(taskCount?.count ?? 0),
      pipelineValue: Number(pipelineResult?.total ?? 0),
      wonDeals: Number(wonResult?.count ?? 0),
    };
  }

  async getTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(tags.name);
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async deleteTag(id: string): Promise<boolean> {
    await db.delete(contactTags).where(eq(contactTags.tagId, id));
    await db.delete(tags).where(eq(tags.id, id));
    return true;
  }

  async getContactTags(contactId: string): Promise<Tag[]> {
    const result = await db
      .select({ tag: tags })
      .from(contactTags)
      .innerJoin(tags, eq(contactTags.tagId, tags.id))
      .where(eq(contactTags.contactId, contactId));
    return result.map(r => r.tag);
  }

  async addTagToContact(contactId: string, tagId: string): Promise<ContactTag> {
    const [ct] = await db.insert(contactTags).values({ contactId, tagId }).returning();
    return ct;
  }

  async removeTagFromContact(contactId: string, tagId: string): Promise<boolean> {
    await db.delete(contactTags).where(
      and(eq(contactTags.contactId, contactId), eq(contactTags.tagId, tagId))
    );
    return true;
  }

  async getActivities(): Promise<Activity[]> {
    return db.select().from(activities).orderBy(desc(activities.createdAt)).limit(50);
  }

  async getActivitiesByContact(contactId: string): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.contactId, contactId)).orderBy(desc(activities.createdAt));
  }

  async getActivitiesByCompany(companyId: string): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.companyId, companyId)).orderBy(desc(activities.createdAt));
  }

  async getActivitiesByDeal(dealId: string): Promise<Activity[]> {
    return db.select().from(activities).where(eq(activities.dealId, dealId)).orderBy(desc(activities.createdAt));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getEmailAccounts(userId: string): Promise<EmailAccount[]> {
    return db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId)).orderBy(desc(emailAccounts.createdAt));
  }

  async getEmailAccount(id: string): Promise<EmailAccount | undefined> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account || undefined;
  }

  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [newAccount] = await db.insert(emailAccounts).values(account).returning();
    return newAccount;
  }

  async updateEmailAccount(id: string, account: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined> {
    const filtered = filterUndefined(account);
    if (Object.keys(filtered).length === 0) {
      return this.getEmailAccount(id);
    }
    const [updated] = await db.update(emailAccounts).set(filtered).where(eq(emailAccounts.id, id)).returning();
    return updated || undefined;
  }

  async deleteEmailAccount(id: string): Promise<boolean> {
    await db.delete(emailAccounts).where(eq(emailAccounts.id, id));
    return true;
  }

  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId)).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const filtered = filterUndefined(template);
    if (Object.keys(filtered).length === 0) {
      return this.getEmailTemplate(id);
    }
    const [updated] = await db.update(emailTemplates).set(filtered).where(eq(emailTemplates.id, id)).returning();
    return updated || undefined;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return true;
  }

  async getScheduledEmails(userId: string): Promise<ScheduledEmail[]> {
    return db.select().from(scheduledEmails).where(eq(scheduledEmails.userId, userId)).orderBy(desc(scheduledEmails.createdAt));
  }

  async getScheduledEmail(id: string): Promise<ScheduledEmail | undefined> {
    const [email] = await db.select().from(scheduledEmails).where(eq(scheduledEmails.id, id));
    return email || undefined;
  }

  async getPendingScheduledEmails(): Promise<ScheduledEmail[]> {
    return db.select().from(scheduledEmails)
      .where(and(
        eq(scheduledEmails.status, "scheduled"),
        sql`scheduled_at <= NOW()`
      ))
      .orderBy(scheduledEmails.scheduledAt);
  }

  async createScheduledEmail(email: InsertScheduledEmail): Promise<ScheduledEmail> {
    const [newEmail] = await db.insert(scheduledEmails).values(email).returning();
    return newEmail;
  }

  async updateScheduledEmail(id: string, email: Partial<InsertScheduledEmail>): Promise<ScheduledEmail | undefined> {
    const filtered = filterUndefined(email);
    if (Object.keys(filtered).length === 0) {
      return this.getScheduledEmail(id);
    }
    const [updated] = await db.update(scheduledEmails).set(filtered).where(eq(scheduledEmails.id, id)).returning();
    return updated || undefined;
  }

  async deleteScheduledEmail(id: string): Promise<boolean> {
    await db.delete(scheduledEmails).where(eq(scheduledEmails.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();
