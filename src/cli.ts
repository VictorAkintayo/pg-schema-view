import { Command } from 'commander';
import { loadConfig, validateConfig, Config } from './config.js';
import { createConnection, closeConnection } from './db/connection.js';
import { introspectSchema } from './db/introspect.js';
import { transformSchema } from './schema/transform.js';
import { renderConsole } from './output/consoleRenderer.js';
import { renderMarkdown } from './output/markdownRenderer.js';
import { renderJson } from './output/jsonRenderer.js';
import { renderMermaid } from './output/mermaidRenderer.js';
import { Logger } from './utils/logger.js';
import { Spinner } from './utils/spinner.js';
import { writeFileSync } from 'fs';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('pg-schema-view')
    .description('A CLI tool for exploring PostgreSQL database schemas')
    .version('1.0.0')
    .option('-c, --connection <string>', 'PostgreSQL connection string (e.g., postgres://user:pass@localhost:5432/dbname)')
    .option('-s, --schema <schemas...>', 'Target schema(s) to introspect (default: public)', ['public'])
    .option('-o, --output <format>', 'Output format: console, markdown, json, mermaid (default: console)', 'console')
    .option('-t, --tables <tables...>', 'Include only these tables (can be specified multiple times)')
    .option('--exclude-tables <tables>', 'Exclude tables (comma-separated)')
    .option('--relationships-only', 'Only render relationships/ER diagram, not detailed columns', false)
    .option('--include-indexes', 'Include index information in output', false)
    .option('--include-constraints', 'Include constraints (unique, check, foreign key details)', false)
    .option('--markdown-file <path>', 'Write markdown output to file (only when --output=markdown)')
    .option('--json-file <path>', 'Write JSON output to file (only when --output=json)')
    .option('--mermaid-file <path>', 'Write Mermaid diagram to file (only when --output=mermaid)')
    .option('--config <path>', 'Path to config file (JSON)')
    .option('--debug', 'Print debug logs', false)
    .action(async (options) => {
      try {
        // Parse exclude-tables if provided
        const excludeTables = options.excludeTables 
          ? options.excludeTables.split(',').map((t: string) => t.trim())
          : [];

        // Build CLI overrides
        const cliOverrides: Partial<Config> = {
          connection: options.connection,
          schemas: options.schema,
          output: options.output,
          tables: options.tables,
          excludeTables,
          relationshipsOnly: options.relationshipsOnly,
          includeIndexes: options.includeIndexes,
          includeConstraints: options.includeConstraints,
          markdownFile: options.markdownFile,
          jsonFile: options.jsonFile,
          mermaidFile: options.mermaidFile,
          debug: options.debug,
        };

        // Load and validate config
        const config = loadConfig(options.config, cliOverrides);
        validateConfig(config);

        const logger = new Logger(config.debug);

        // Filter tables if specified
        let tablesFilter: Set<string> | undefined;
        if (config.tables && config.tables.length > 0) {
          tablesFilter = new Set(config.tables);
          logger.debug(`Filtering to tables: ${Array.from(tablesFilter).join(', ')}`);
        }

        const excludeTablesSet = new Set(config.excludeTables.map(t => t.toLowerCase()));

        // Connect to database
        const spinner = new Spinner('Connecting to database...');
        spinner.start();
        
        let client;
        try {
          client = await createConnection(config.connection!, logger);
          spinner.succeed('Connected to database');
        } catch (error) {
          spinner.fail();
          throw error;
        }

        try {
          // Introspect schema
          const introspectSpinner = new Spinner('Introspecting schema...');
          introspectSpinner.start();
          
          const rawSchema = await introspectSchema(client, config.schemas, logger);
          introspectSpinner.succeed(`Found ${rawSchema.tables.length} table(s)`);

          // Transform schema
          const schema = transformSchema(
            rawSchema,
            config.includeIndexes,
            config.includeConstraints
          );

          // Filter tables
          if (tablesFilter || excludeTablesSet.size > 0) {
            schema.tables = schema.tables.filter(table => {
              const tableKey = `${table.schema}.${table.name}`;
              const tableNameLower = table.name.toLowerCase();
              
              if (excludeTablesSet.has(tableNameLower)) {
                return false;
              }
              
              if (tablesFilter) {
                return tablesFilter.has(table.name) || tablesFilter.has(tableKey);
              }
              
              return true;
            });
          }

          if (schema.tables.length === 0) {
            logger.warn('No tables found matching the specified criteria');
            return;
          }

          // Render output
          let output: string;
          let outputFile: string | undefined;

          switch (config.output) {
            case 'console':
              output = renderConsole(schema, config.includeIndexes, config.includeConstraints);
              break;
            case 'markdown':
              output = renderMarkdown(schema, config.includeIndexes, config.includeConstraints);
              outputFile = config.markdownFile;
              break;
            case 'json':
              output = renderJson(schema);
              outputFile = config.jsonFile;
              break;
            case 'mermaid':
              output = renderMermaid(schema, config.relationshipsOnly);
              outputFile = config.mermaidFile;
              break;
            default:
              throw new Error(`Unsupported output format: ${config.output}`);
          }

          // Write output
          if (outputFile) {
            writeFileSync(outputFile, output, 'utf-8');
            logger.success(`Output written to ${outputFile}`);
          } else {
            console.log(output);
          }
        } finally {
          await closeConnection(client, logger);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\nError: ${message}`);
        process.exit(1);
      }
    });

  return program;
}

