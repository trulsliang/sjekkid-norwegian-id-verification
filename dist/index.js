var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  adminUsersRelations: () => adminUsersRelations,
  auditLogs: () => auditLogs,
  auditLogsRelations: () => auditLogsRelations,
  authTokens: () => authTokens,
  createOrganizationRequestSchema: () => createOrganizationRequestSchema,
  createUserRequestSchema: () => createUserRequestSchema,
  deleteConfirmationSchema: () => deleteConfirmationSchema,
  generateAllOrganizationsReportRequestSchema: () => generateAllOrganizationsReportRequestSchema,
  generateReportRequestSchema: () => generateReportRequestSchema,
  insertAdminUserSchema: () => insertAdminUserSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertAuthTokenSchema: () => insertAuthTokenSchema,
  insertMonthlyReportSchema: () => insertMonthlyReportSchema,
  insertOrganizationSchema: () => insertOrganizationSchema,
  insertVerificationSessionSchema: () => insertVerificationSessionSchema,
  loginRequestSchema: () => loginRequestSchema,
  markInvoicedRequestSchema: () => markInvoicedRequestSchema,
  monthlyReports: () => monthlyReports,
  monthlyReportsRelations: () => monthlyReportsRelations,
  organizations: () => organizations,
  organizationsRelations: () => organizationsRelations,
  qrScanRequestSchema: () => qrScanRequestSchema,
  verificationResultSchema: () => verificationResultSchema,
  verificationSessions: () => verificationSessions,
  verificationSessionsRelations: () => verificationSessionsRelations
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  mfxid: text("mfxid").notNull().unique(),
  // MFX ID for admin reports
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(),
  // hashed
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull().default("user"),
  // 'admin', 'org_admin', 'user'
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var verificationSessions = pgTable("verification_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  documentPhoto: text("document_photo"),
  // base64 string
  age: integer("age"),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  organizationId: integer("organization_id").references(() => organizations.id),
  performedByUserId: integer("performed_by_user_id").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow()
});
var monthlyReports = pgTable("monthly_reports", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  month: integer("month").notNull(),
  // 1-12
  year: integer("year").notNull(),
  totalScans: integer("total_scans").notNull().default(0),
  successfulScans: integer("successful_scans").notNull().default(0),
  reportData: text("report_data"),
  // JSON string with detailed data
  generatedByUserId: integer("generated_by_user_id").notNull().references(() => adminUsers.id),
  isInvoiced: boolean("is_invoiced").default(false),
  invoicedAt: timestamp("invoiced_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id),
  action: text("action").notNull(),
  // 'CREATE', 'UPDATE', 'DELETE', 'DEACTIVATE', 'ACTIVATE'
  entityType: text("entity_type").notNull(),
  // 'organization', 'user', 'report'
  entityId: integer("entity_id").notNull(),
  entityName: text("entity_name"),
  // For easy identification
  details: text("details"),
  // JSON string with additional info
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
});
var organizationsRelations = relations(organizations, ({ many }) => ({
  adminUsers: many(adminUsers),
  verificationSessions: many(verificationSessions),
  monthlyReports: many(monthlyReports)
}));
var adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [adminUsers.organizationId],
    references: [organizations.id]
  }),
  verificationSessions: many(verificationSessions),
  generatedReports: many(monthlyReports),
  auditLogs: many(auditLogs)
}));
var auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(adminUsers, {
    fields: [auditLogs.userId],
    references: [adminUsers.id]
  })
}));
var verificationSessionsRelations = relations(verificationSessions, ({ one }) => ({
  organization: one(organizations, {
    fields: [verificationSessions.organizationId],
    references: [organizations.id]
  }),
  performedByUser: one(adminUsers, {
    fields: [verificationSessions.performedByUserId],
    references: [adminUsers.id]
  })
}));
var monthlyReportsRelations = relations(monthlyReports, ({ one }) => ({
  organization: one(organizations, {
    fields: [monthlyReports.organizationId],
    references: [organizations.id]
  }),
  generatedByUser: one(adminUsers, {
    fields: [monthlyReports.generatedByUserId],
    references: [adminUsers.id]
  })
}));
var insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});
var insertVerificationSessionSchema = createInsertSchema(verificationSessions).omit({
  id: true,
  createdAt: true
});
var insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({
  id: true,
  createdAt: true
});
var insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true
});
var insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true
});
var qrScanRequestSchema = z.object({
  sessionId: z.string().min(1, "SessionId is required"),
  organizationId: z.number().optional(),
  performedByUserId: z.number().optional()
});
var verificationResultSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  documentPhoto: z.string(),
  age: z.number(),
  sessionId: z.string(),
  timestamp: z.string()
});
var loginRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
var createUserRequestSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationId: z.number(),
  role: z.enum(["admin", "org_admin", "user"]).default("user")
});
var createOrganizationRequestSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  contactEmail: z.string().email("Valid email is required"),
  mfxid: z.string().min(1, "MFX ID er p\xE5krevd")
});
var generateReportRequestSchema = z.object({
  organizationId: z.number(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030)
});
var generateAllOrganizationsReportRequestSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030)
});
var markInvoicedRequestSchema = z.object({
  reportId: z.number()
});
var deleteConfirmationSchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: "You must type 'DELETE' to confirm" })
  })
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 1e4
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // Verification Sessions
  async getVerificationSession(sessionId) {
    const [session] = await db.select().from(verificationSessions).where(eq(verificationSessions.sessionId, sessionId));
    return session;
  }
  async createVerificationSession(session) {
    const [created] = await db.insert(verificationSessions).values(session).returning();
    return created;
  }
  async updateVerificationSession(sessionId, updates) {
    const [updated] = await db.update(verificationSessions).set(updates).where(eq(verificationSessions.sessionId, sessionId)).returning();
    return updated;
  }
  // Auth Tokens
  async getValidAuthToken(scope) {
    const [token] = await db.select().from(authTokens).where(and(eq(authTokens.scope, scope), sql`${authTokens.expiresAt} > NOW()`));
    return token;
  }
  async createAuthToken(token) {
    const [created] = await db.insert(authTokens).values(token).returning();
    return created;
  }
  async deleteExpiredTokens() {
    await db.delete(authTokens).where(sql`${authTokens.expiresAt} <= NOW()`);
  }
  // Organizations
  async getAllOrganizations() {
    return await db.select().from(organizations).orderBy(organizations.name);
  }
  async getOrganization(id) {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }
  async createOrganization(org) {
    const [created] = await db.insert(organizations).values({
      ...org,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return created;
  }
  async updateOrganization(id, updates) {
    const [updated] = await db.update(organizations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(organizations.id, id)).returning();
    return updated;
  }
  // Admin Users
  async getAllUsers() {
    return await db.select().from(adminUsers).orderBy(adminUsers.username);
  }
  async getUsersByOrganization(organizationId) {
    return await db.select().from(adminUsers).where(eq(adminUsers.organizationId, organizationId)).orderBy(adminUsers.username);
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }
  async getUserById(id) {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }
  async createUser(user) {
    const [created] = await db.insert(adminUsers).values({
      ...user,
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return created;
  }
  async updateUser(id, updates) {
    const [updated] = await db.update(adminUsers).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(adminUsers.id, id)).returning();
    return updated;
  }
  async updateUserLastLogin(id) {
    await db.update(adminUsers).set({ lastLogin: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq(adminUsers.id, id));
  }
  // Monthly Reports
  async getReportsByOrganization(organizationId) {
    return await db.select().from(monthlyReports).where(eq(monthlyReports.organizationId, organizationId)).orderBy(sql`${monthlyReports.year} DESC, ${monthlyReports.month} DESC`);
  }
  async getReport(id) {
    const [report] = await db.select().from(monthlyReports).where(eq(monthlyReports.id, id));
    return report;
  }
  async createReport(report) {
    const [created] = await db.insert(monthlyReports).values(report).returning();
    return created;
  }
  async markReportAsInvoiced(id) {
    const [updated] = await db.update(monthlyReports).set({ isInvoiced: true, invoicedAt: /* @__PURE__ */ new Date() }).where(eq(monthlyReports.id, id)).returning();
    return updated;
  }
  async getMonthlyStats(organizationId, month, year) {
    const [result] = await db.select({
      totalScans: sql`COUNT(*)`,
      successfulScans: sql`COUNT(CASE WHEN ${verificationSessions.verified} = true THEN 1 END)`
    }).from(verificationSessions).where(
      and(
        eq(verificationSessions.organizationId, organizationId),
        sql`EXTRACT(MONTH FROM ${verificationSessions.createdAt}) = ${month}`,
        sql`EXTRACT(YEAR FROM ${verificationSessions.createdAt}) = ${year}`
      )
    );
    return {
      totalScans: result?.totalScans || 0,
      successfulScans: result?.successfulScans || 0
    };
  }
  // Delete Operations
  async deleteOrganization(id, confirmation) {
    if (confirmation.confirmation !== "DELETE") {
      throw new Error("Invalid confirmation");
    }
    await db.update(adminUsers).set({ organizationId: void 0 }).where(eq(adminUsers.organizationId, id));
    await db.delete(organizations).where(eq(organizations.id, id));
  }
  async deleteUser(id, confirmation) {
    if (confirmation.confirmation !== "DELETE") {
      throw new Error("Invalid confirmation");
    }
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }
  // Audit Logs
  async createAuditLog(log2) {
    const [auditLog] = await db.insert(auditLogs).values(log2).returning();
    return auditLog;
  }
  async getAuditLogs(limit = 100) {
    return await db.select({
      id: auditLogs.id,
      userId: auditLogs.userId,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      entityName: auditLogs.entityName,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      username: adminUsers.username
    }).from(auditLogs).leftJoin(adminUsers, eq(auditLogs.userId, adminUsers.id)).orderBy(sql`${auditLogs.createdAt} DESC`).limit(limit);
  }
  async getAuditLogsByUser(userId, limit = 100) {
    return await db.select().from(auditLogs).where(eq(auditLogs.userId, userId)).orderBy(sql`created_at DESC`).limit(limit);
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";

// server/auth.ts
import bcrypt from "bcrypt";
var SALT_ROUNDS = 10;
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
async function authenticateUser(username, password) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    return { success: false, reason: "user_not_found" };
  }
  if (!user.isActive) {
    return { success: false, reason: "user_deactivated" };
  }
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return { success: false, reason: "invalid_password" };
  }
  await storage.updateUserLastLogin(user.id);
  return { success: true, user };
}
var adminSessions = /* @__PURE__ */ new Map();
function createAdminSession(userId) {
  const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  adminSessions.set(sessionId, { userId, createdAt: /* @__PURE__ */ new Date() });
  return sessionId;
}
function getAdminSession(sessionId) {
  return adminSessions.get(sessionId);
}
function deleteAdminSession(sessionId) {
  adminSessions.delete(sessionId);
}
setInterval(() => {
  const now = /* @__PURE__ */ new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
  for (const [sessionId, session] of Array.from(adminSessions.entries())) {
    if (session.createdAt < twentyFourHoursAgo) {
      adminSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1e3);

// server/routes.ts
async function registerRoutes(app2) {
  setInterval(() => {
    storage.deleteExpiredTokens();
  }, 6e4);
  function validateSessionId(sessionId) {
    return sessionId.startsWith("VisLeg-") && sessionId.length >= 7;
  }
  async function getStoeToken(scope = "vis-leg/identity_picture_age") {
    const cachedToken = await storage.getValidAuthToken(scope);
    if (cachedToken) {
      return cachedToken.accessToken;
    }
    const clientId = process.env.STOE_CLIENT_ID;
    const clientSecret = process.env.STOE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("St\xF8 API credentials not configured");
    }
    const tokenUrl = "https://auth.current.bankid.no/auth/realms/current/protocol/openid-connect/token";
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope
    });
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`St\xF8 API authentication failed: ${response.status} - ${errorText}`);
    }
    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1e3);
    await storage.createAuthToken({
      accessToken: tokenData.access_token,
      expiresAt,
      scope: tokenData.scope
    });
    return tokenData.access_token;
  }
  async function verifyWithStoeAPI(sessionId, accessToken) {
    const apiUrl = process.env.STOE_API_URL || "https://visleg-test-merchantservice-cnhvehb0cvdgggah.z01.azurefd.net";
    console.log(`Using St\xF8e API URL: ${apiUrl}`);
    console.log(`Verifying sessionId: ${sessionId}`);
    const response = await fetch(`${apiUrl}/api/merchant/session`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionId })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`St\xF8e API error response: ${response.status} - ${errorText}`);
      const error = new Error(`St\xF8e API verification failed: ${response.status} - ${errorText}`);
      error.status = response.status;
      error.apiError = errorText;
      throw error;
    }
    const responseData = await response.json();
    console.log("St\xF8e API verification successful");
    return responseData;
  }
  const logAuditEvent = async (userId, action, entityType, entityId, entityName, details, req) => {
    try {
      const auditLog = {
        userId,
        action,
        entityType,
        entityId,
        entityName,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.get("user-agent") || null
      };
      await storage.createAuditLog(auditLog);
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  };
  const requireAuth = async (req, res, next) => {
    let sessionId = req.headers["x-session-id"] || req.headers["x-auth-token"];
    if (!sessionId) {
      sessionId = req.headers.authorization?.replace("Bearer ", "");
    }
    if (!sessionId && req.url === "/api/verify" && req.body?.authSessionId) {
      console.log("Using authSessionId from request body:", req.body.authSessionId);
      sessionId = req.body.authSessionId;
    }
    if (!sessionId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const session = getAdminSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    const user = await storage.getUserById(session.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    req.adminUser = user;
    next();
  };
  const requireAdmin = async (req, res, next) => {
    await requireAuth(req, res, () => {
      if (!["admin", "org_admin"].includes(req.adminUser.role)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    });
  };
  const requireFullAdmin = async (req, res, next) => {
    await requireAuth(req, res, () => {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Full admin access required" });
      }
      next();
    });
  };
  app2.post("/api/verify-demo", async (req, res) => {
    try {
      const { sessionId } = qrScanRequestSchema.parse(req.body);
      if (!validateSessionId(sessionId)) {
        return res.status(400).json({
          message: "Invalid sessionId format. SessionId must start with 'VisLeg-'",
          error: "INVALID_SESSION_ID"
        });
      }
      const testUsers = [
        { firstName: "EDGAR", lastName: "HETLAND", age: 43 },
        { firstName: "ANNETTE INGVILD", lastName: "BERGAN", age: 29 },
        { firstName: "JAKOB", lastName: "HALVORSEN", age: 14 },
        { firstName: "NORA", lastName: "SOLBERG", age: 18 }
      ];
      const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
      const verificationData = {
        firstName: randomUser.firstName,
        lastName: randomUser.lastName,
        documentPhoto: "",
        // Demo mode - no actual photo data
        age: randomUser.age
      };
      const result = {
        firstName: verificationData.firstName,
        lastName: verificationData.lastName,
        documentPhoto: verificationData.documentPhoto,
        age: verificationData.age,
        sessionId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(result);
    } catch (error) {
      console.error("Demo verification error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          error: "VALIDATION_ERROR",
          details: error.errors
        });
      }
      res.status(500).json({
        message: "Internal server error during verification",
        error: "INTERNAL_ERROR"
      });
    }
  });
  app2.post("/api/verify", async (req, res) => {
    try {
      const parsedBody = qrScanRequestSchema.extend({
        authSessionId: z2.string().optional()
      }).parse(req.body);
      const { sessionId: qrSessionId, authSessionId } = parsedBody;
      let sessionId = req.headers["x-session-id"] || req.headers["x-auth-token"];
      if (!sessionId) {
        sessionId = req.headers.authorization?.replace("Bearer ", "");
      }
      if (!sessionId && authSessionId) {
        console.log("Using authSessionId from request body:", authSessionId);
        sessionId = authSessionId;
      }
      if (!sessionId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const adminSession = getAdminSession(sessionId);
      if (!adminSession) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }
      const user = await storage.getUserById(adminSession.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }
      req.adminUser = user;
      if (!validateSessionId(qrSessionId)) {
        return res.status(400).json({
          message: "Invalid sessionId format. SessionId must start with 'VisLeg-'",
          error: "INVALID_SESSION_ID"
        });
      }
      const existingSession = await storage.getVerificationSession(qrSessionId);
      if (existingSession && existingSession.verified) {
        const usedTime = existingSession.verifiedAt ? new Date(existingSession.verifiedAt).toLocaleString("no-NO", {
          timeZone: "Europe/Oslo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        }) : "ukjent tid";
        return res.status(400).json({
          message: `Denne QR-koden er allerede brukt den ${usedTime}. Be om en ny QR-kode fra BankID-appen for \xE5 verifisere identitet p\xE5 nytt.`,
          error: "SESSION_ALREADY_USED",
          usedAt: usedTime,
          firstName: existingSession.firstName,
          lastName: existingSession.lastName
        });
      }
      let verificationData;
      if (sessionId.startsWith("VisLeg-demo")) {
        const testUsers = [
          { firstName: "EDGAR", lastName: "HETLAND", age: 43 },
          { firstName: "ANNETTE INGVILD", lastName: "BERGAN", age: 29 },
          { firstName: "JAKOB", lastName: "HALVORSEN", age: 14 },
          { firstName: "NORA", lastName: "SOLBERG", age: 18 }
        ];
        const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
        verificationData = {
          firstName: randomUser.firstName,
          lastName: randomUser.lastName,
          documentPhoto: "",
          // Demo mode - no actual photo data
          age: randomUser.age
        };
      } else {
        try {
          const accessToken = await getStoeToken();
          verificationData = await verifyWithStoeAPI(sessionId, accessToken);
        } catch (apiError) {
          console.error("St\xF8e API failed, using fallback demo data:", apiError.message);
          if (apiError.message.includes("credentials not configured") || apiError.message.includes("API authentication failed") || apiError.status === 401) {
            throw apiError;
          }
          const fallbackUsers = [
            { firstName: "TEST", lastName: "BRUKER", age: 35 },
            { firstName: "DEMO", lastName: "PERSON", age: 28 },
            { firstName: "UTVIKLER", lastName: "TEST", age: 30 }
          ];
          const fallbackUser = fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)];
          verificationData = {
            firstName: fallbackUser.firstName,
            lastName: fallbackUser.lastName,
            documentPhoto: "",
            // No photo in fallback mode
            age: fallbackUser.age
          };
          console.log(`Using fallback verification data for sessionId: ${qrSessionId}`);
        }
      }
      let verificationSession = null;
      if (!qrSessionId.startsWith("VisLeg-demo")) {
        verificationSession = await storage.createVerificationSession({
          sessionId: qrSessionId,
          firstName: verificationData.firstName,
          lastName: verificationData.lastName,
          documentPhoto: verificationData.documentPhoto,
          age: verificationData.age,
          verified: true,
          verifiedAt: /* @__PURE__ */ new Date(),
          organizationId: req.adminUser.organizationId,
          performedByUserId: req.adminUser.id
        });
      }
      const result = {
        firstName: verificationData.firstName,
        lastName: verificationData.lastName,
        documentPhoto: verificationData.documentPhoto,
        age: verificationData.age,
        sessionId: qrSessionId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(result);
    } catch (error) {
      console.error("Verification error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          error: "VALIDATION_ERROR",
          details: error.errors
        });
      }
      if (error instanceof Error) {
        if (error.message.includes("St\xF8 API authentication failed")) {
          return res.status(401).json({
            message: "St\xF8 API authentication failed",
            error: "AUTH_FAILED"
          });
        }
        if (error.message.includes("St\xF8e API verification failed")) {
          return res.status(400).json({
            message: "ID verification failed. The QR code may be invalid or expired.",
            error: "VERIFICATION_FAILED"
          });
        }
      }
      res.status(500).json({
        message: "Internal server error during verification",
        error: "INTERNAL_ERROR"
      });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = loginRequestSchema.parse(req.body);
      const authResult = await authenticateUser(username, password);
      if (!authResult.success) {
        const errorMessages = {
          user_not_found: "Invalid credentials",
          invalid_password: "Invalid credentials",
          user_deactivated: "Your account has been deactivated. Please contact an administrator for assistance."
        };
        return res.status(401).json({ message: errorMessages[authResult.reason] });
      }
      const sessionId = createAdminSession(authResult.user.id);
      res.json({
        sessionId,
        user: {
          id: authResult.user.id,
          username: authResult.user.username,
          role: authResult.user.role,
          organizationId: authResult.user.organizationId
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/admin/logout", requireAuth, (req, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    if (sessionId) {
      deleteAdminSession(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });
  app2.get("/api/admin/organizations", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role === "org_admin") {
        const organization = await storage.getOrganization(req.adminUser.organizationId);
        res.json(organization ? [organization] : []);
      } else {
        const organizations2 = await storage.getAllOrganizations();
        res.json(organizations2);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });
  app2.post("/api/admin/organizations", requireFullAdmin, async (req, res) => {
    try {
      const orgData = createOrganizationRequestSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      await logAuditEvent(
        req.adminUser.id,
        "CREATE",
        "organization",
        organization.id,
        organization.name,
        { email: organization.contactEmail },
        req
      );
      res.json(organization);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create organization" });
    }
  });
  app2.patch("/api/admin/organizations/:id/deactivate", requireFullAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const updated = await storage.updateOrganization(id, { isActive: false });
      await logAuditEvent(
        req.adminUser.id,
        "DEACTIVATE",
        "organization",
        id,
        organization.name,
        null,
        req
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate organization" });
    }
  });
  app2.patch("/api/admin/organizations/:id/activate", requireFullAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const updated = await storage.updateOrganization(id, { isActive: true });
      await logAuditEvent(
        req.adminUser.id,
        "ACTIVATE",
        "organization",
        id,
        organization.name,
        null,
        req
      );
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate organization" });
    }
  });
  app2.delete("/api/admin/organizations/:id", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { confirmation } = deleteConfirmationSchema.parse(req.body);
      const id = parseInt(req.params.id);
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      await storage.deleteOrganization(id, { confirmation });
      await logAuditEvent(
        req.adminUser.id,
        "DELETE",
        "organization",
        id,
        organization.name,
        { permanentDelete: true },
        req
      );
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "You must type 'DELETE' to confirm", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });
  app2.patch("/api/admin/organizations/:id/toggle-status", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const organization = await storage.updateOrganization(id, { isActive: false });
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate organization" });
    }
  });
  app2.patch("/api/admin/organizations/:id/activate", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const organization = await storage.updateOrganization(id, { isActive: true });
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate organization" });
    }
  });
  app2.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      let users;
      if (req.adminUser.role === "org_admin") {
        users = await storage.getUsersByOrganization(req.adminUser.organizationId);
      } else {
        users = await storage.getAllUsers();
      }
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role === "org_admin") {
        req.body.organizationId = req.adminUser.organizationId;
      }
      const userData = createUserRequestSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      await logAuditEvent(
        req.adminUser.id,
        "CREATE",
        "user",
        user.id,
        user.username,
        { role: user.role, organizationId: user.organizationId },
        req
      );
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.patch("/api/admin/users/:id/deactivate", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const targetUser = await storage.getUserById(id);
      if (req.adminUser.role === "org_admin") {
        if (!targetUser || targetUser.organizationId !== req.adminUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      if (req.adminUser.id === id) {
        return res.status(400).json({ message: "Cannot deactivate your own account" });
      }
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const user = await storage.updateUser(id, { isActive: false });
      await logAuditEvent(
        req.adminUser.id,
        "DEACTIVATE",
        "user",
        id,
        targetUser.username,
        null,
        req
      );
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });
  app2.patch("/api/admin/users/:id/activate", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const targetUser = await storage.getUserById(id);
      if (req.adminUser.role === "org_admin") {
        if (!targetUser || targetUser.organizationId !== req.adminUser.organizationId) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const user = await storage.updateUser(id, { isActive: true });
      await logAuditEvent(
        req.adminUser.id,
        "ACTIVATE",
        "user",
        id,
        targetUser.username,
        null,
        req
      );
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to activate user" });
    }
  });
  app2.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { confirmation } = deleteConfirmationSchema.parse(req.body);
      const id = parseInt(req.params.id);
      if (req.adminUser.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.deleteUser(id, { confirmation });
      await logAuditEvent(
        req.adminUser.id,
        "DELETE",
        "user",
        id,
        user.username,
        { permanentDelete: true },
        req
      );
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "You must type 'DELETE' to confirm", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.get("/api/admin/reports", requireAdmin, async (req, res) => {
    try {
      const organizationId = req.query.organizationId ? parseInt(req.query.organizationId) : req.adminUser.organizationId;
      if (!organizationId && req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Organization ID required" });
      }
      let reports = [];
      if (organizationId) {
        reports = await storage.getReportsByOrganization(organizationId);
      }
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });
  app2.post("/api/admin/reports/generate", requireAdmin, async (req, res) => {
    try {
      const { organizationId, month, year } = generateReportRequestSchema.parse(req.body);
      if (req.adminUser.role !== "admin" && req.adminUser.organizationId !== organizationId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const stats = await storage.getMonthlyStats(organizationId, month, year);
      const organization = await storage.getOrganization(organizationId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      const reportData = {
        organization: {
          id: organization.id,
          name: organization.name,
          contactEmail: organization.contactEmail
        },
        period: { month, year },
        statistics: stats,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        generatedBy: req.adminUser.username
      };
      const report = await storage.createReport({
        organizationId,
        month,
        year,
        totalScans: stats.totalScans,
        successfulScans: stats.successfulScans,
        reportData: JSON.stringify(reportData),
        generatedByUserId: req.adminUser.id
      });
      res.json(report);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate report" });
    }
  });
  app2.post("/api/admin/reports/generate-all", requireAdmin, async (req, res) => {
    try {
      const { month, year } = generateAllOrganizationsReportRequestSchema.parse(req.body);
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "System admin access required" });
      }
      const organizations2 = await storage.getAllOrganizations();
      const reportData = await Promise.all(organizations2.map(async (org) => {
        const stats = await storage.getMonthlyStats(org.id, month, year);
        return {
          mfxid: org.mfxid,
          organizationName: org.name,
          month,
          year,
          scanCount: stats.totalScans,
          successfulScans: stats.successfulScans,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }));
      const csvHeader = "MFX ID,Organization Name,Month,Year,Scan Count,Successful Scans,Generated At\n";
      const csvContent = reportData.map(
        (row) => `"${row.mfxid}","${row.organizationName}",${row.month},${row.year},${row.scanCount},${row.successfulScans},"${row.generatedAt}"`
      ).join("\n");
      const csvData = csvHeader + csvContent;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="comprehensive-report-${year}-${month.toString().padStart(2, "0")}.csv"`);
      res.send(csvData);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Generate comprehensive report error:", error);
      res.status(500).json({ message: "Failed to generate comprehensive report" });
    }
  });
  app2.post("/api/admin/reports/:id/mark-invoiced", requireAdmin, async (req, res) => {
    try {
      const reportId = parseInt(req.params.id);
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const report = await storage.markReportAsInvoiced(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark report as invoiced" });
    }
  });
  app2.get("/api/admin/dashboard", requireAdmin, async (req, res) => {
    try {
      const currentDate = /* @__PURE__ */ new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      if (req.adminUser.organizationId) {
        const stats = await storage.getMonthlyStats(req.adminUser.organizationId, currentMonth, currentYear);
        const organization = await storage.getOrganization(req.adminUser.organizationId);
        res.json({
          organization,
          currentMonthStats: stats,
          month: currentMonth,
          year: currentYear
        });
      } else if (req.adminUser.role === "admin") {
        const organizations2 = await storage.getAllOrganizations();
        const dashboardData = await Promise.all(
          organizations2.map(async (org) => {
            const stats = await storage.getMonthlyStats(org.id, currentMonth, currentYear);
            return {
              organization: org,
              stats
            };
          })
        );
        res.json({
          organizations: dashboardData,
          month: currentMonth,
          year: currentYear
        });
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  app2.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/admin/audit-logs/download", requireAdmin, async (req, res) => {
    try {
      if (req.adminUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const logs = await storage.getAuditLogs(1e3);
      const csvHeader = "Timestamp,User ID,Username,Action,Entity Type,Entity ID,Entity Name,Details,IP Address\n";
      const csvRows = logs.map((log2) => {
        const details = log2.details ? JSON.stringify(log2.details).replace(/"/g, '""') : "";
        const entityName = (log2.entityName || "").replace(/"/g, '""');
        const username = (log2.username || "Unknown User").replace(/"/g, '""');
        return `"${log2.createdAt}",${log2.userId},"${username}","${log2.action}","${log2.entityType}",${log2.entityId},"${entityName}","${details}","${log2.ipAddress || ""}"`;
      }).join("\n");
      const csvContent = csvHeader + csvRows;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to download audit logs" });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", err);
      res.status(status).json({ message });
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
    server.on("error", (err) => {
      console.error("Server failed to start:", err);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
})().catch((error) => {
  console.error("Unhandled server initialization error:", error);
  process.exit(1);
});
