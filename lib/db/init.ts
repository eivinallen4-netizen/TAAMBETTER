import client from '../db';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function initializeDatabase() {
  try {
    const schemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      await client.execute(statement);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
