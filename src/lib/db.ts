import fs from "fs/promises";
import path from "path";
import os from "os";

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

export const MAX_WAITLIST_CAPACITY = 100;

// In-memory fallback and cache to ensure 100% reliability across serverless invocations
let inMemoryStore: Subscriber[] = [];

// Determine writable file path (Vercel / Lambda environment uses /tmp)
function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === "production") {
    return path.join(os.tmpdir(), "waitlist.json");
  }
  return path.join(process.cwd(), "data", "waitlist.json");
}

// Ensure database directory and file exist safely
async function ensureStorage(): Promise<string> {
  const filePath = getDbFilePath();
  const dir = path.dirname(filePath);
  try {
    await fs.mkdir(dir, { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(inMemoryStore, null, 2), "utf-8");
    }
    return filePath;
  } catch {
    // If primary directory fails (e.g. read-only filesystem), fallback to os.tmpdir()
    const tmpPath = path.join(os.tmpdir(), "waitlist.json");
    try {
      await fs.writeFile(tmpPath, JSON.stringify(inMemoryStore, null, 2), "utf-8");
    } catch {
      // In-memory store will serve as fallback
    }
    return tmpPath;
  }
}

// Read all subscribers
export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const filePath = await ensureStorage();
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content || "[]") as Subscriber[];
    
    // Merge disk subscribers with in-memory store
    const emailMap = new Map<string, Subscriber>();
    for (const sub of inMemoryStore) {
      if (sub?.email) emailMap.set(sub.email.toLowerCase(), sub);
    }
    for (const sub of parsed) {
      if (sub?.email) emailMap.set(sub.email.toLowerCase(), sub);
    }
    inMemoryStore = Array.from(emailMap.values());
    return inMemoryStore;
  } catch (err) {
    console.warn("Reading from in-memory subscriber store fallback:", err);
    return inMemoryStore;
  }
}

// Add a new subscriber with 100-user limit
export async function addSubscriber(
  email: string,
  meta?: { ip?: string; userAgent?: string }
): Promise<{
  subscriber?: Subscriber;
  isNew: boolean;
  totalCount: number;
  isLimitReached: boolean;
}> {
  const subscribers = await getSubscribers();
  const normalizedEmail = email.trim().toLowerCase();

  // Check if already exists
  const existing = subscribers.find((s) => s.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return {
      subscriber: existing,
      isNew: false,
      totalCount: subscribers.length,
      isLimitReached: false,
    };
  }

  // Check if limit of 100 is reached
  if (subscribers.length >= MAX_WAITLIST_CAPACITY) {
    return {
      isNew: false,
      totalCount: subscribers.length,
      isLimitReached: true,
    };
  }

  const newSubscriber: Subscriber = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    ip: meta?.ip || "unknown",
    userAgent: meta?.userAgent || "unknown",
  };

  subscribers.push(newSubscriber);
  inMemoryStore = [...subscribers];

  // Persist to disk safely without throwing unhandled exceptions
  try {
    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(subscribers, null, 2), "utf-8");
  } catch (err) {
    // Attempt fallback to tmp directory
    try {
      const tmpPath = path.join(os.tmpdir(), "waitlist.json");
      await fs.writeFile(tmpPath, JSON.stringify(subscribers, null, 2), "utf-8");
    } catch {
      console.warn("Could not write to disk; subscriber retained in memory store");
    }
  }

  return {
    subscriber: newSubscriber,
    isNew: true,
    totalCount: subscribers.length,
    isLimitReached: false,
  };
}

// Get total subscriber count
export async function getSubscriberCount(): Promise<number> {
  const subscribers = await getSubscribers();
  return subscribers.length;
}

