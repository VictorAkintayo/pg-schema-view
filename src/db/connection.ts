import { Client } from 'pg';
import { Logger } from '../utils/logger.js';

export async function createConnection(connectionString: string, logger: Logger): Promise<Client> {
  logger.debug(`Connecting to database: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
  
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    logger.debug('Database connection established');
    return client;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to connect to database: ${message}\n\nPlease check your connection string and ensure PostgreSQL is running.`);
  }
}

export async function closeConnection(client: Client, logger: Logger): Promise<void> {
  try {
    await client.end();
    logger.debug('Database connection closed');
  } catch (error) {
    logger.debug(`Error closing connection: ${error instanceof Error ? error.message : String(error)}`);
  }
}

