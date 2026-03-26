// Query TiDB Cloud directly using the production connection string
import mysql from 'mysql2/promise';

// Read TiDB connection from environment variables set in Railway
// These are stored as secrets in the project
const tidbUrl = process.env.TIDB_DATABASE_URL || process.env.DATABASE_URL;

// Try to find TiDB-specific connection details
const envKeys = Object.keys(process.env).filter(k => 
  k.includes('TIDB') || k.includes('tidb') || k.includes('gateway')
);
console.log('Available TiDB env keys:', envKeys);
console.log('DATABASE_URL host:', process.env.DATABASE_URL?.match(/@([^:\/]+)/)?.[1]);
