import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

// Ensure the database file exists in a persistent location
// For local development, sqlite.db in root is fine
const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema });
