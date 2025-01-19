import { drizzle } from "drizzle-orm/postgres-js";
import postgres from 'postgres';
import * as schema from "@db/schema";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to set it in your .env file?",
  );
}

// Create the connection
const client = postgres(process.env.DATABASE_URL);

export const db = drizzle(client, { schema });