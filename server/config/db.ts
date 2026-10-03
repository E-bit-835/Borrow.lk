import pg from 'pg';
import { config } from './env';

const { Pool } = pg;

// Create connection pool targeting NeonDB PostgreSQL
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required for Neon SSL connection
  },
  max: 20, // Max concurrent pooled connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // 30s — allows Neon to wake from scale-to-zero
  statement_timeout: 30000, // 30s per statement
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle NeonDB client:', err.message);
});

/**
 * Execute a parameterized query against NeonDB
 */
export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 500) {
      console.log(`[NeonDB Slow Query] (${duration}ms):`, text.substring(0, 100));
    }
    return res;
  } catch (error: any) {
    console.error('❌ Database Query Error:', {
      query: text.substring(0, 120),
      params,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Execute operations within a database transaction
 */
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Helper: wait for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verify connectivity to NeonDB with retry logic
 * Retries up to 3 times with exponential backoff to handle Neon cold-starts
 */
export async function verifyConnection(retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempting NeonDB connection (attempt ${attempt}/${retries})...`);
      const res = await query('SELECT NOW() AS current_time, current_database() AS db_name, version() AS pg_version');
      console.log('✅ Connected to NeonDB successfully:', {
        database: res.rows[0].db_name,
        time: res.rows[0].current_time,
        version: res.rows[0].pg_version.split(' ')[0] + ' ' + res.rows[0].pg_version.split(' ')[1],
        branch: config.neonBranch,
      });
      return true;
    } catch (error: any) {
      console.error(`❌ Connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        const delay = attempt * 3000; // 3s, 6s backoff
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }
  console.error('❌ All NeonDB connection attempts failed. The database may be unavailable.');
  return false;
}
