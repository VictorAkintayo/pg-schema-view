import { Client } from 'pg';
import { Logger } from '../utils/logger.js';

export interface RawTable {
  schema: string;
  name: string;
  kind: 'table' | 'view' | 'materialized_view';
}

export interface RawColumn {
  schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
  ordinal_position: number;
}

export interface RawPrimaryKey {
  schema: string;
  table_name: string;
  constraint_name: string;
  column_name: string;
  ordinal_position: number;
}

export interface RawUniqueConstraint {
  schema: string;
  table_name: string;
  constraint_name: string;
  column_name: string;
  ordinal_position: number;
}

export interface RawForeignKey {
  schema: string;
  table_name: string;
  constraint_name: string;
  column_name: string;
  ordinal_position: number;
  referenced_schema: string;
  referenced_table: string;
  referenced_column: string;
  on_update: string | null;
  on_delete: string | null;
}

export interface RawIndex {
  schema: string;
  table_name: string;
  index_name: string;
  column_name: string;
  ordinal_position: number;
  is_unique: boolean;
  index_type: string;
}

export interface IntrospectionResult {
  tables: RawTable[];
  columns: RawColumn[];
  primaryKeys: RawPrimaryKey[];
  uniqueConstraints: RawUniqueConstraint[];
  foreignKeys: RawForeignKey[];
  indexes: RawIndex[];
}

export async function introspectSchema(
  client: Client,
  schemas: string[],
  logger: Logger
): Promise<IntrospectionResult> {
  const schemaList = schemas.map(s => `'${s.replace(/'/g, "''")}'`).join(',');
  
  logger.debug(`Introspecting schemas: ${schemas.join(', ')}`);

  // Query tables
  const tablesQuery = `
    SELECT 
      n.nspname AS schema,
      c.relname AS name,
      CASE 
        WHEN c.relkind = 'r' THEN 'table'
        WHEN c.relkind = 'v' THEN 'view'
        WHEN c.relkind = 'm' THEN 'materialized_view'
        ELSE 'table'
      END AS kind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname IN (${schemaList})
      AND c.relkind IN ('r', 'v', 'm')
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = c.oid AND d.deptype = 'e'
      )
    ORDER BY n.nspname, c.relname;
  `;

  // Query columns
  const columnsQuery = `
    SELECT 
      table_schema AS schema,
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default,
      ordinal_position
    FROM information_schema.columns
    WHERE table_schema IN (${schemaList})
    ORDER BY table_schema, table_name, ordinal_position;
  `;

  // Query primary keys
  const primaryKeysQuery = `
    SELECT 
      tc.table_schema AS schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema IN (${schemaList})
    ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;
  `;

  // Query unique constraints
  const uniqueConstraintsQuery = `
    SELECT 
      tc.table_schema AS schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'UNIQUE'
      AND tc.table_schema IN (${schemaList})
    ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;
  `;

  // Query foreign keys
  const foreignKeysQuery = `
    SELECT 
      tc.table_schema AS schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      kcu.ordinal_position,
      ccu.table_schema AS referenced_schema,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.update_rule AS on_update,
      rc.delete_rule AS on_delete
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.constraint_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema IN (${schemaList})
    ORDER BY tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position;
  `;

  // Query indexes (exclude indexes that are backing constraints, as those are already captured)
  const indexesQuery = `
    SELECT 
      n.nspname AS schema,
      t.relname AS table_name,
      i.relname AS index_name,
      a.attname AS column_name,
      idx.indisunique AS is_unique,
      am.amname AS index_type,
      (
        SELECT array_position(idx.indkey, a.attnum)
      ) AS ordinal_position
    FROM pg_class t
    JOIN pg_index idx ON t.oid = idx.indrelid
    JOIN pg_class i ON i.oid = idx.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_am am ON am.oid = i.relam
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(idx.indkey)
    WHERE n.nspname IN (${schemaList})
      AND t.relkind = 'r'
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conindid = i.oid
      )
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY n.nspname, t.relname, i.relname, ordinal_position;
  `;

  try {
    const startTime = Date.now();
    
    const [tablesResult, columnsResult, primaryKeysResult, uniqueConstraintsResult, foreignKeysResult, indexesResult] = 
      await Promise.all([
        client.query(tablesQuery),
        client.query(columnsQuery),
        client.query(primaryKeysQuery),
        client.query(uniqueConstraintsQuery),
        client.query(foreignKeysQuery),
        client.query(indexesQuery),
      ]);

    const duration = Date.now() - startTime;
    logger.debug(`Introspection completed in ${duration}ms`);
    logger.debug(`Found ${tablesResult.rows.length} tables, ${columnsResult.rows.length} columns`);

    return {
      tables: tablesResult.rows as RawTable[],
      columns: columnsResult.rows as RawColumn[],
      primaryKeys: primaryKeysResult.rows as RawPrimaryKey[],
      uniqueConstraints: uniqueConstraintsResult.rows as RawUniqueConstraint[],
      foreignKeys: foreignKeysResult.rows as RawForeignKey[],
      indexes: indexesResult.rows as RawIndex[],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to introspect database schema: ${message}`);
  }
}

