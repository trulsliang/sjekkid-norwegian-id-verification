import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  mfxid: text("mfxid").notNull().unique(), // MFX ID for admin reports
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(), // hashed
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull().default("user"), // 'admin', 'org_admin', 'user'
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const verificationSessions = pgTable("verification_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  documentPhoto: text("document_photo"), // base64 string
  age: integer("age"),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  organizationId: integer("organization_id").references(() => organizations.id),
  performedByUserId: integer("performed_by_user_id").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly reports table
export const monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  totalScans: integer("total_scans").notNull().default(0),
  successfulScans: integer("successful_scans").notNull().default(0),
  reportData: text("report_data"), // JSON string with detailed data
  generatedByUserId: integer("generated_by_user_id").notNull().references(() => adminUsers.id),
  isInvoiced: boolean("is_invoiced").default(false),
  invoicedAt: timestamp("invoiced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit log table for tracking admin actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id),
  action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'ACTIVATE'
  entityType: text("entity_type").notNull(), // 'organization', 'user', 'report'
  entityId: integer("entity_id").notNull(),
  entityName: text("entity_name"), // For easy identification
  details: text("details"), // JSON string with additional info
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  adminUsers: many(adminUsers),
  verificationSessions: many(verificationSessions),
  monthlyReports: many(monthlyReports),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [adminUsers.organizationId],
    references: [organizations.id],
  }),
  verificationSessions: many(verificationSessions),
  generatedReports: many(monthlyReports),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(adminUsers, {
    fields: [auditLogs.userId],
    references: [adminUsers.id],
  }),
}));

export const verificationSessionsRelations = relations(verificationSessions, ({ one }) => ({
  organization: one(organizations, {
    fields: [verificationSessions.organizationId],
    references: [organizations.id],
  }),
  performedByUser: one(adminUsers, {
    fields: [verificationSessions.performedByUserId],
    references: [adminUsers.id],
  }),
}));

export const monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [monthlyReports.organizationId],
    references: [organizations.id],
  }),
  generatedByUser: one(adminUsers, {
    fields: [monthlyReports.generatedByUserId],
    references: [adminUsers.id],
  }),
}));

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertVerificationSessionSchema = createInsertSchema(verificationSessions).omit({
  id: true,
  createdAt: true,
});

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({
  id: true,
  createdAt: true,
});

export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type VerificationSession = typeof verificationSessions.$inferSelect;
export type InsertVerificationSession = z.infer<typeof insertVerificationSessionSchema>;
export type MonthlyReport = typeof monthlyReports.$inferSelect;
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = z.infer<typeof insertAuthTokenSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// API Request/Response schemas
export const qrScanRequestSchema = z.object({
  sessionId: z.string().min(1, "SessionId is required"),
  organizationId: z.number().optional(),
  performedByUserId: z.number().optional(),
});

export const verificationResultSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  documentPhoto: z.string(),
  age: z.number(),
  sessionId: z.string(),
  timestamp: z.string(),
});

export const loginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const createUserRequestSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationId: z.number(),
  role: z.enum(["admin", "org_admin", "user"]).default("user"),
});

export const createOrganizationRequestSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  contactEmail: z.string().email("Valid email is required"),
  mfxid: z.string().min(1, "MFX ID er påkrevd"),
});

export const generateReportRequestSchema = z.object({
  organizationId: z.number(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
});

export const generateAllOrganizationsReportRequestSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
});

export const markInvoicedRequestSchema = z.object({
  reportId: z.number(),
});

export const deleteConfirmationSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: "You must type 'DELETE' to confirm" }),
  }),
});

export type QrScanRequest = z.infer<typeof qrScanRequestSchema>;
export type VerificationResult = z.infer<typeof verificationResultSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type CreateOrganizationRequest = z.infer<typeof createOrganizationRequestSchema>;
export type GenerateReportRequest = z.infer<typeof generateReportRequestSchema>;
export type GenerateAllOrganizationsReportRequest = z.infer<typeof generateAllOrganizationsReportRequestSchema>;
export type MarkInvoicedRequest = z.infer<typeof markInvoicedRequestSchema>;
export type DeleteConfirmation = z.infer<typeof deleteConfirmationSchema>;

// Dashboard data types
export interface DashboardData {
  currentMonthStats?: {
    totalScans: number;
    successfulScans: number;
  };
  organization?: Organization;
  organizations?: Array<{
    organization: Organization;
    stats: {
      totalScans: number;
      successfulScans: number;
    };
  }>;
  month?: number;
  year?: number;
}
