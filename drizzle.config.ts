import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
    schema: "./src/lib/db/schema.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: databaseUrl,
    },
});
