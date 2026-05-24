import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let _instance: DbInstance | undefined;

function getInstance(): DbInstance {
  if (!_instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    _instance = drizzle(neon(url), { schema });
  }
  return _instance;
}

// Lazy proxy — doesn't connect until first query at request time
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_, prop) {
    const instance = getInstance();
    const val = instance[prop as keyof DbInstance];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});
