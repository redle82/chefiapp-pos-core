import { Pool } from "pg";

export class PostgresLink {
  private static instance: PostgresLink | null = null;
  private readonly pool: Pool;

  private constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (connectionString) {
      this.pool = new Pool({ connectionString });
      return;
    }

    this.pool = new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      database: process.env.PGDATABASE || "postgres",
    });
  }

  static getInstance(): PostgresLink {
    if (!PostgresLink.instance) {
      PostgresLink.instance = new PostgresLink();
    }
    return PostgresLink.instance;
  }

  getPool(): Pool {
    return this.pool;
  }
}
