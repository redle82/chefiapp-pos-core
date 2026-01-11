import { Pool, PoolConfig } from "pg";

export class PostgresLink {
    private static instance: PostgresLink;
    private pool: Pool;

    private constructor(config?: PoolConfig) {
        this.pool = new Pool(
            config || {
                // Defaults or env vars usually
                connectionString: process.env.DATABASE_URL,
            }
        );

        this.pool.on("error", (err) => {
            console.error("Unexpected error on idle client", err);
            // Don't exit, just log.
        });
    }

    public static getInstance(config?: PoolConfig): PostgresLink {
        if (!PostgresLink.instance) {
            PostgresLink.instance = new PostgresLink(config);
        }
        return PostgresLink.instance;
    }

    public getPool(): Pool {
        return this.pool;
    }

    public async close(): Promise<void> {
        await this.pool.end();
    }

    /**
     * Execute a query with standardized error handling
     */
    public async query(text: string, params?: any[]): Promise<any> {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            return res;
        } catch (err) {
            // In a real system, we'd wrap specific PG errors here
            throw err;
        }
    }
}
