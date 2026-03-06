import { Client } from "pg";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const getDatabaseUrl = () => getRequiredEnv("DATABASE_URL");

export class DBConnection {
  client: Client;

  private constructor(client: Client) {
    this.client = client;

    setTimeout(async () => {
      try {
        await this.client.end();
      } catch {
        // ignore if already closed
      }
    }, 15 * 1000);
  }

  static async create(): Promise<DBConnection> {
    const DATABASE_URL = getDatabaseUrl();
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    // Neon roles can have an empty search_path; force public for unqualified table names.
    await client.query("SET search_path TO public");
    return new DBConnection(client);
  }
}
