import { readFileSync } from 'fs';

export interface Config {
  connection?: string;
  schemas: string[];
  excludeTables: string[];
  includeIndexes: boolean;
  includeConstraints: boolean;
  output: 'console' | 'markdown' | 'json' | 'mermaid';
  tables?: string[];
  relationshipsOnly: boolean;
  markdownFile?: string;
  jsonFile?: string;
  mermaidFile?: string;
  debug: boolean;
}

const DEFAULT_CONFIG: Config = {
  schemas: ['public'],
  excludeTables: [],
  includeIndexes: false,
  includeConstraints: false,
  output: 'console',
  relationshipsOnly: false,
  debug: false,
};

export function loadConfig(configPath?: string, cliOverrides: Partial<Config> = {}): Config {
  // Start with defaults
  let config: Config = { ...DEFAULT_CONFIG };

  // Load from config file if provided
  if (configPath) {
    try {
      const configContent = readFileSync(configPath, 'utf-8');
      const fileConfig = JSON.parse(configContent) as Partial<Config>;
      config = { ...config, ...fileConfig };
    } catch (error) {
      throw new Error(`Failed to load config file: ${configPath}. ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Load from environment variables
  const envConfig: Partial<Config> = {};
  
  if (process.env.PGHOST || process.env.PGUSER || process.env.PGDATABASE) {
    // Build connection string from env vars if not already set
    if (!config.connection) {
      const host = process.env.PGHOST || 'localhost';
      const port = process.env.PGPORT || '5432';
      const database = process.env.PGDATABASE || '';
      const user = process.env.PGUSER || '';
      const password = process.env.PGPASSWORD || '';
      
      if (database && user) {
        const auth = password ? `${user}:${password}@` : `${user}@`;
        envConfig.connection = `postgres://${auth}${host}:${port}/${database}`;
      }
    }
  }

  // Merge: defaults -> file -> env -> CLI (CLI has highest priority)
  config = { ...config, ...envConfig, ...cliOverrides };

  return config;
}

export function validateConfig(config: Config): void {
  if (!config.connection) {
    throw new Error(
      'Database connection string is required.\n' +
      'Provide it via:\n' +
      '  - --connection / -c flag: pg-schema-view -c postgres://user:pass@localhost:5432/dbname\n' +
      '  - Environment variables: PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT\n' +
      '  - Config file: { "connection": "postgres://..." }'
    );
  }

  if (config.schemas.length === 0) {
    throw new Error('At least one schema must be specified');
  }

  const validOutputs: Config['output'][] = ['console', 'markdown', 'json', 'mermaid'];
  if (!validOutputs.includes(config.output)) {
    throw new Error(`Invalid output format: ${config.output}. Must be one of: ${validOutputs.join(', ')}`);
  }
}

