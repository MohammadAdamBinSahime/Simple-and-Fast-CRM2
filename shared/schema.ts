import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export const userRoles = ["user", "admin"] as const;
export type UserRole = typeof userRoles[number];

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity types
export const activityTypes = ["login", "logout", "register"] as const;
export type ActivityType = typeof activityTypes[number];

// Login activities table
export const loginActivities = pgTable("login_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  username: text("username").notNull(),
  eventType: text("event_type").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Companies table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain"),
  industry: text("industry"),
  size: text("size"),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  jobTitle: text("job_title"),
  companyId: varchar("company_id").references(() => companies.id),
  status: text("status").notNull().default("lead"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deals table
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(),
  stage: text("stage").notNull().default("lead"),
  probability: integer("probability").default(0),
  expectedCloseDate: timestamp("expected_close_date"),
  contactId: varchar("contact_id").references(() => contacts.id),
  companyId: varchar("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notes table
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  contactId: varchar("contact_id").references(() => contacts.id),
  companyId: varchar("company_id").references(() => companies.id),
  dealId: varchar("deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: text("completed").notNull().default("false"),
  priority: text("priority").notNull().default("medium"),
  contactId: varchar("contact_id").references(() => contacts.id),
  companyId: varchar("company_id").references(() => companies.id),
  dealId: varchar("deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  deals: many(deals),
  notes: many(notes),
  tasks: many(tasks),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  deals: many(deals),
  notes: many(notes),
  tasks: many(tasks),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [deals.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [deals.companyId],
    references: [companies.id],
  }),
  notes: many(notes),
  tasks: many(tasks),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  contact: one(contacts, {
    fields: [notes.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [notes.companyId],
    references: [companies.id],
  }),
  deal: one(deals, {
    fields: [notes.dealId],
    references: [deals.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  contact: one(contacts, {
    fields: [tasks.contactId],
    references: [contacts.id],
  }),
  company: one(companies, {
    fields: [tasks.companyId],
    references: [companies.id],
  }),
  deal: one(deals, {
    fields: [tasks.dealId],
    references: [deals.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertLoginActivitySchema = createInsertSchema(loginActivities).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLoginActivity = z.infer<typeof insertLoginActivitySchema>;
export type LoginActivity = typeof loginActivities.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Contact statuses
export const contactStatuses = ["lead", "qualified", "customer", "inactive"] as const;
export type ContactStatus = typeof contactStatuses[number];

// Deal stages
export const dealStages = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
export type DealStage = typeof dealStages[number];

// Task priorities
export const taskPriorities = ["low", "medium", "high"] as const;
export type TaskPriority = typeof taskPriorities[number];
