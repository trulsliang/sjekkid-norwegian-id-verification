import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export type AuthResult = 
  | { success: true; user: AdminUser }
  | { success: false; reason: 'user_not_found' | 'invalid_password' | 'user_deactivated' };

export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return { success: false, reason: 'user_not_found' };
  }
  
  if (!user.isActive) {
    return { success: false, reason: 'user_deactivated' };
  }
  
  const isPasswordValid = await verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return { success: false, reason: 'invalid_password' };
  }
  
  // Update last login
  await storage.updateUserLastLogin(user.id);
  
  return { success: true, user };
}

// Simple session store for admin users (in production, use Redis or database sessions)
const adminSessions = new Map<string, { userId: number; createdAt: Date }>();

export function createAdminSession(userId: number): string {
  const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  adminSessions.set(sessionId, { userId, createdAt: new Date() });
  return sessionId;
}

export function getAdminSession(sessionId: string): { userId: number; createdAt: Date } | undefined {
  return adminSessions.get(sessionId);
}

export function deleteAdminSession(sessionId: string): void {
  adminSessions.delete(sessionId);
}

// Clean up expired sessions (older than 24 hours)
setInterval(() => {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  for (const [sessionId, session] of Array.from(adminSessions.entries())) {
    if (session.createdAt < twentyFourHoursAgo) {
      adminSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour