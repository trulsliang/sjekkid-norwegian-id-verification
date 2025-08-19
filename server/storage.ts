import { 
  verificationSessions, 
  authTokens,
  organizations,
  adminUsers,
  monthlyReports,
  auditLogs,
  type VerificationSession, 
  type InsertVerificationSession,
  type AuthToken,
  type InsertAuthToken,
  type Organization,
  type InsertOrganization,
  type AdminUser,
  type InsertAdminUser,
  type MonthlyReport,
  type InsertMonthlyReport,
  type AuditLog,
  type InsertAuditLog,
  type DeleteConfirmation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Verification Sessions
  getVerificationSession(sessionId: string): Promise<VerificationSession | undefined>;
  createVerificationSession(session: InsertVerificationSession): Promise<VerificationSession>;
  updateVerificationSession(sessionId: string, updates: Partial<InsertVerificationSession>): Promise<VerificationSession | undefined>;
  
  // Auth Tokens
  getValidAuthToken(scope: string): Promise<AuthToken | undefined>;
  createAuthToken(token: InsertAuthToken): Promise<AuthToken>;
  deleteExpiredTokens(): Promise<void>;

  // Organizations
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // Admin Users
  getAllUsers(): Promise<AdminUser[]>;
  getUsersByOrganization(organizationId: number): Promise<AdminUser[]>;
  getUserByUsername(username: string): Promise<AdminUser | undefined>;
  getUserById(id: number): Promise<AdminUser | undefined>;
  createUser(user: InsertAdminUser): Promise<AdminUser>;
  updateUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Monthly Reports
  getReportsByOrganization(organizationId: number): Promise<MonthlyReport[]>;
  getReport(id: number): Promise<MonthlyReport | undefined>;
  createReport(report: InsertMonthlyReport): Promise<MonthlyReport>;
  markReportAsInvoiced(id: number): Promise<MonthlyReport | undefined>;
  getMonthlyStats(organizationId: number, month: number, year: number): Promise<{ totalScans: number; successfulScans: number }>;
  
  // Delete Operations
  deleteOrganization(id: number, confirmation: DeleteConfirmation): Promise<void>;
  deleteUser(id: number, confirmation: DeleteConfirmation): Promise<void>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: number, limit?: number): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Verification Sessions
  async getVerificationSession(sessionId: string): Promise<VerificationSession | undefined> {
    const [session] = await db.select().from(verificationSessions).where(eq(verificationSessions.sessionId, sessionId));
    return session;
  }

  async createVerificationSession(session: InsertVerificationSession): Promise<VerificationSession> {
    const [created] = await db.insert(verificationSessions).values(session).returning();
    return created;
  }

  async updateVerificationSession(sessionId: string, updates: Partial<InsertVerificationSession>): Promise<VerificationSession | undefined> {
    const [updated] = await db
      .update(verificationSessions)
      .set(updates)
      .where(eq(verificationSessions.sessionId, sessionId))
      .returning();
    return updated;
  }

  // Auth Tokens
  async getValidAuthToken(scope: string): Promise<AuthToken | undefined> {
    const [token] = await db
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.scope, scope), sql`${authTokens.expiresAt} > NOW()`));
    return token;
  }

  async createAuthToken(token: InsertAuthToken): Promise<AuthToken> {
    const [created] = await db.insert(authTokens).values(token).returning();
    return created;
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(authTokens).where(sql`${authTokens.expiresAt} <= NOW()`);
  }

  // Organizations
  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(organizations.name);
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values({
      ...org,
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [updated] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updated;
  }

  // Admin Users
  async getAllUsers(): Promise<AdminUser[]> {
    return await db.select().from(adminUsers).orderBy(adminUsers.username);
  }

  async getUsersByOrganization(organizationId: number): Promise<AdminUser[]> {
    return await db.select().from(adminUsers)
      .where(eq(adminUsers.organizationId, organizationId))
      .orderBy(adminUsers.username);
  }

  async getUserByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getUserById(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async createUser(user: InsertAdminUser): Promise<AdminUser> {
    const [created] = await db.insert(adminUsers).values({
      ...user,
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateUser(id: number, updates: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const [updated] = await db
      .update(adminUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return updated;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(adminUsers.id, id));
  }

  // Monthly Reports
  async getReportsByOrganization(organizationId: number): Promise<MonthlyReport[]> {
    return await db
      .select()
      .from(monthlyReports)
      .where(eq(monthlyReports.organizationId, organizationId))
      .orderBy(sql`${monthlyReports.year} DESC, ${monthlyReports.month} DESC`);
  }

  async getReport(id: number): Promise<MonthlyReport | undefined> {
    const [report] = await db.select().from(monthlyReports).where(eq(monthlyReports.id, id));
    return report;
  }

  async createReport(report: InsertMonthlyReport): Promise<MonthlyReport> {
    const [created] = await db.insert(monthlyReports).values(report).returning();
    return created;
  }

  async markReportAsInvoiced(id: number): Promise<MonthlyReport | undefined> {
    const [updated] = await db
      .update(monthlyReports)
      .set({ isInvoiced: true, invoicedAt: new Date() })
      .where(eq(monthlyReports.id, id))
      .returning();
    return updated;
  }

  async getMonthlyStats(organizationId: number, month: number, year: number): Promise<{ totalScans: number; successfulScans: number }> {
    const [result] = await db
      .select({
        totalScans: sql<number>`COUNT(*)`,
        successfulScans: sql<number>`COUNT(CASE WHEN ${verificationSessions.verified} = true THEN 1 END)`,
      })
      .from(verificationSessions)
      .where(
        and(
          eq(verificationSessions.organizationId, organizationId),
          sql`EXTRACT(MONTH FROM ${verificationSessions.createdAt}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${verificationSessions.createdAt}) = ${year}`
        )
      );
    
    return {
      totalScans: result?.totalScans || 0,
      successfulScans: result?.successfulScans || 0,
    };
  }

  // Delete Operations
  async deleteOrganization(id: number, confirmation: DeleteConfirmation): Promise<void> {
    if (confirmation.confirmation !== "DELETE") {
      throw new Error("Invalid confirmation");
    }
    
    // First, set all users in this organization to have no organization
    await db.update(adminUsers)
      .set({ organizationId: undefined })
      .where(eq(adminUsers.organizationId, id));
    
    // Then delete the organization
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async deleteUser(id: number, confirmation: DeleteConfirmation): Promise<void> {
    if (confirmation.confirmation !== "DELETE") {
      throw new Error("Invalid confirmation");
    }
    
    await db.delete(adminUsers).where(eq(adminUsers.id, id));
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(limit: number = 100): Promise<(AuditLog & { username: string | null })[]> {
    return await db
      .select({
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
        username: adminUsers.username,
      })
      .from(auditLogs)
      .leftJoin(adminUsers, eq(auditLogs.userId, adminUsers.id))
      .orderBy(sql`${auditLogs.createdAt} DESC`)
      .limit(limit);
  }

  async getAuditLogsByUser(userId: number, limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(sql`created_at DESC`)
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
