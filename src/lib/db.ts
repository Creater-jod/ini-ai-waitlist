import fs from "fs/promises";
import path from "path";

export interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
  ip?: string;
  userAgent?: string;
}

export const MAX_WAITLIST_CAPACITY = 100;

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "waitlist.json");

// Ensure data directory and database file exist
async function ensureDbExists(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      await fs.writeFile(DB_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to initialize database file:", err);
  }
}

// Read all subscribers
export async function getSubscribers(): Promise<Subscriber[]> {
  await ensureDbExists();
  try {
    const content = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(content || "[]") as Subscriber[];
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
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
  await ensureDbExists();
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
  await fs.writeFile(DB_FILE, JSON.stringify(subscribers, null, 2), "utf-8");

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
