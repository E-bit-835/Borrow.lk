import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, verifyConnection } from '../config/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('🚀 Running database migrations on NeonDB...');
  
  const isConnected = await verifyConnection();
  if (!isConnected) {
    throw new Error('Cannot connect to NeonDB. Check your DATABASE_URL in .env');
  }

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('⏳ Executing schema.sql...');
    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query('COMMIT');
    console.log('✅ Database migrations applied successfully to NeonDB!');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Execute directly if run via CLI
const isDirectRun = process.argv[1]?.includes('migrate');
if (isDirectRun) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

