import {
  PgSchemaModel,
  PgTable,
  PgColumn,
  PgPrimaryKey,
  PgUniqueConstraint,
  PgForeignKey,
  PgIndex,
} from './types.js';
import {
  IntrospectionResult,
  RawTable,
  RawColumn,
  RawPrimaryKey,
  RawUniqueConstraint,
  RawForeignKey,
  RawIndex,
} from '../db/introspect.js';

export function transformSchema(
  raw: IntrospectionResult,
  includeIndexes: boolean,
  includeConstraints: boolean
): PgSchemaModel {
  const tablesMap = new Map<string, PgTable>();
  const schemasSet = new Set<string>();

  // Process tables
  for (const rawTable of raw.tables) {
    const key = `${rawTable.schema}.${rawTable.name}`;
    schemasSet.add(rawTable.schema);
    
    tablesMap.set(key, {
      schema: rawTable.schema,
      name: rawTable.name,
      kind: rawTable.kind,
      columns: [],
      primaryKey: undefined,
      uniqueConstraints: [],
      foreignKeys: [],
      indexes: [],
    });
  }

  // Process columns
  for (const rawColumn of raw.columns) {
    const key = `${rawColumn.schema}.${rawColumn.table_name}`;
    const table = tablesMap.get(key);
    if (!table) continue;

    table.columns.push({
      name: rawColumn.column_name,
      dataType: rawColumn.data_type,
      isNullable: rawColumn.is_nullable === 'YES',
      defaultValue: rawColumn.column_default,
      isPrimaryKey: false,
      isUnique: false,
    });
  }

  // Process primary keys (always include, not dependent on includeConstraints)
  const pkMap = new Map<string, { name: string; columns: Array<{ name: string; position: number }> }>();
  
  for (const rawPk of raw.primaryKeys) {
    const key = `${rawPk.schema}.${rawPk.table_name}`;
    if (!pkMap.has(key)) {
      pkMap.set(key, { name: rawPk.constraint_name, columns: [] });
    }
    pkMap.get(key)!.columns.push({ name: rawPk.column_name, position: rawPk.ordinal_position });
  }

  for (const [key, pk] of pkMap.entries()) {
    const table = tablesMap.get(key);
    if (!table) continue;

    pk.columns.sort((a, b) => a.position - b.position);
    table.primaryKey = {
      name: pk.name,
      columns: pk.columns.map(c => c.name),
    };

    // Mark columns as primary key
    for (const colName of table.primaryKey.columns) {
      const col = table.columns.find(c => c.name === colName);
      if (col) {
        col.isPrimaryKey = true;
      }
    }
  }

  // Process unique constraints
  if (includeConstraints) {
    const uniqueMap = new Map<string, Map<string, { name: string; columns: Array<{ name: string; position: number }> }>>();
    
    for (const rawUnique of raw.uniqueConstraints) {
      const key = `${rawUnique.schema}.${rawUnique.table_name}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, new Map());
      }
      const tableUniques = uniqueMap.get(key)!;
      if (!tableUniques.has(rawUnique.constraint_name)) {
        tableUniques.set(rawUnique.constraint_name, { name: rawUnique.constraint_name, columns: [] });
      }
      tableUniques.get(rawUnique.constraint_name)!.columns.push({ 
        name: rawUnique.column_name, 
        position: rawUnique.ordinal_position 
      });
    }

    for (const [key, tableUniques] of uniqueMap.entries()) {
      const table = tablesMap.get(key);
      if (!table) continue;

      for (const unique of tableUniques.values()) {
        unique.columns.sort((a, b) => a.position - b.position);
        table.uniqueConstraints.push({
          name: unique.name,
          columns: unique.columns.map(c => c.name),
        });

        // Mark single-column unique constraints
        if (unique.columns.length === 1) {
          const colName = unique.columns[0].name;
          const col = table.columns.find(c => c.name === colName);
          if (col) {
            col.isUnique = true;
          }
        }
      }
    }
  }

  // Process foreign keys
  if (includeConstraints) {
    const fkMap = new Map<string, { 
      name: string; 
      columns: Array<{ name: string; position: number }>; 
      referencedColumns: Array<{ name: string; position: number }>;
      ref: RawForeignKey;
    }>();
    
    for (const rawFk of raw.foreignKeys) {
      const key = `${rawFk.schema}.${rawFk.table_name}`;
      const fkKey = `${key}::${rawFk.constraint_name}`;
      
      if (!fkMap.has(fkKey)) {
        fkMap.set(fkKey, {
          name: rawFk.constraint_name,
          columns: [],
          referencedColumns: [],
          ref: rawFk,
        });
      }
      const fk = fkMap.get(fkKey)!;
      fk.columns.push({ name: rawFk.column_name, position: rawFk.ordinal_position });
      fk.referencedColumns.push({ name: rawFk.referenced_column, position: rawFk.ordinal_position });
    }

    for (const [fkKey, fk] of fkMap.entries()) {
      const tableKey = fkKey.split('::')[0];
      const table = tablesMap.get(tableKey);
      if (!table) continue;

      fk.columns.sort((a, b) => a.position - b.position);
      fk.referencedColumns.sort((a, b) => a.position - b.position);
      table.foreignKeys.push({
        name: fk.name,
        columns: fk.columns.map(c => c.name),
        referencedTable: fk.ref.referenced_table,
        referencedSchema: fk.ref.referenced_schema,
        referencedColumns: fk.referencedColumns.map(c => c.name),
        onUpdate: fk.ref.on_update || undefined,
        onDelete: fk.ref.on_delete || undefined,
      });
    }
  }

  // Process indexes
  if (includeIndexes) {
    const indexMap = new Map<string, { name: string; columns: Array<{ name: string; position: number }>; isUnique: boolean; type: string }>();
    
    for (const rawIndex of raw.indexes) {
      const key = `${rawIndex.schema}.${rawIndex.table_name}`;
      const indexKey = `${key}::${rawIndex.index_name}`;
      
      if (!indexMap.has(indexKey)) {
        indexMap.set(indexKey, {
          name: rawIndex.index_name,
          columns: [],
          isUnique: rawIndex.is_unique,
          type: rawIndex.index_type,
        });
      }
      indexMap.get(indexKey)!.columns.push({ 
        name: rawIndex.column_name, 
        position: rawIndex.ordinal_position || 0 
      });
    }

    for (const [indexKey, index] of indexMap.entries()) {
      const tableKey = indexKey.split('::')[0];
      const table = tablesMap.get(tableKey);
      if (!table) continue;

      index.columns.sort((a, b) => a.position - b.position);
      table.indexes.push({
        name: index.name,
        columns: index.columns.map(c => c.name),
        isUnique: index.isUnique,
        type: index.type,
      });
    }
  }

  // Filter tables if needed
  const tables = Array.from(tablesMap.values());

  return {
    schemas: Array.from(schemasSet).sort(),
    tables: tables.sort((a, b) => {
      if (a.schema !== b.schema) {
        return a.schema.localeCompare(b.schema);
      }
      return a.name.localeCompare(b.name);
    }),
  };
}

