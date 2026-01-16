import { type User, type InsertUser, type EmailLog } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email Logs
  getEmailLogs(): EmailLog[];
  addEmailLog(log: EmailLog): void;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private emailLogs: EmailLog[];

  constructor() {
    this.users = new Map();
    this.emailLogs = [];
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  getEmailLogs(): EmailLog[] {
    return this.emailLogs;
  }

  addEmailLog(log: EmailLog): void {
    this.emailLogs.push(log);
  }
}

export const storage = new MemStorage();
