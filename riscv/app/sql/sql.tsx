import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

/** Prefer local DATABASE_URL from .env; keep HOSTED_DATABASE_URL as legacy fallback. */
function getDatabaseUrl(): string {
  const local = process.env.DATABASE_URL?.trim();
  if (local) return local;

  const hosted = process.env.HOSTED_DATABASE_URL?.trim();
  if (hosted) return hosted;

  throw new Error("Missing required environment variable: DATABASE_URL");
}

function getSslConfig(databaseUrl: string) {
  const sslMode = new URL(databaseUrl).searchParams.get("sslmode");
  if (sslMode === "disable") return false;
  if (sslMode === "require" || process.env.NODE_ENV === "production") {
    return { rejectUnauthorized: false };
  }
  return false;
}

type GlobalWithDbPool = typeof globalThis & {
  __riscvDbPool?: Pool;
};

export type DBClient = {
  query: <T extends QueryResultRow = any>(
    text: string,
    params?: unknown[]
  ) => Promise<QueryResult<T>>;
  end: () => Promise<void>;
};

function getPool(): Pool {
  const globalWithPool = globalThis as GlobalWithDbPool;
  if (!globalWithPool.__riscvDbPool) {
    const databaseUrl = getDatabaseUrl();
    globalWithPool.__riscvDbPool = new Pool({
      connectionString: databaseUrl,
      ssl: getSslConfig(databaseUrl),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalWithPool.__riscvDbPool;
}

function wrapClient(client: PoolClient): DBClient {
  let released = false;
  const release = async () => {
    if (released) return;
    released = true;
    client.release();
  };

  return {
    query: async <T extends QueryResultRow = any>(
      text: string,
      params?: unknown[]
    ) => client.query<T>(text, params),
    end: release,
  };
}

export class DBConnection {
  client: DBClient;

  private constructor(client: DBClient) {
    this.client = client;
  }

  static async create(): Promise<DBConnection> {
    const pool = getPool();
    const client = await pool.connect();
    await client.query("SET search_path TO public");
    return new DBConnection(wrapClient(client));
  }
}
