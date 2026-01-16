import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Organization Branding Schema
export const organizationBrandingSchema = z.object({
  id: z.string().default("default"),
  logo: z.object({
    url: z.string().nullable().optional(),
    fileName: z.string().optional(),
    uploadedAt: z.string().optional(),
    fileSize: z.number().optional(),
  }).nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type OrganizationBranding = z.infer<typeof organizationBrandingSchema>;

// Organization Schema
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  website: z.string().optional(),
  industry: z.string(),
  location: z.string(),
  state: z.string().optional(),
  street1: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  currency: z.string().optional().default("INR"),
  language: z.string().optional().default("English"),
  timezone: z.string().optional(),
  gstRegistered: z.boolean().optional().default(false),
  gstin: z.string().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;

// Email Logs and Preferences
export const emailLogSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  transactionId: z.string().optional(), // Invoice, Estimate, etc.
  transactionType: z.string().optional(),
  type: z.enum(["manual", "automated", "workflow"]),
  status: z.enum(["queued", "sent", "failed"]),
  errorMessage: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  sentAt: z.string(),
  recipient: z.string(),
  attachments: z.array(z.string()).optional(),
});

export type EmailLog = z.infer<typeof emailLogSchema>;

export const customerCommunicationPreferencesSchema = z.object({
  invoiceReminders: z.boolean().default(false),
  recurringInvoiceAutoEmail: z.boolean().default(false),
  paymentReceipts: z.boolean().default(false),
  portalNotifications: z.boolean().default(false),
});

export type CustomerCommunicationPreferences = z.infer<typeof customerCommunicationPreferencesSchema>;
