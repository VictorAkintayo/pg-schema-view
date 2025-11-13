import { PgSchemaModel, PgTable } from '../schema/types.js';

export function renderMarkdown(schema: PgSchemaModel, includeIndexes: boolean, includeConstraints: boolean): string {
  const lines: string[] = [];
  
  lines.push('# Database Schema');
  lines.push('');

  // Group tables by schema
  const tablesBySchema = new Map<string, PgTable[]>();
  for (const table of schema.tables) {
    if (!tablesBySchema.has(table.schema)) {
      tablesBySchema.set(table.schema, []);
    }
    tablesBySchema.get(table.schema)!.push(table);
  }

  for (const schemaName of schema.schemas) {
    const tables = tablesBySchema.get(schemaName) || [];
    if (tables.length === 0) continue;

    lines.push(`## Schema: ${schemaName}`);
    lines.push('');

    for (const table of tables) {
      const kindLabel = table.kind === 'view' ? ' (VIEW)' : table.kind === 'materialized_view' ? ' (MATERIALIZED VIEW)' : '';
      lines.push(`### Table: ${table.name}${kindLabel}`);
      lines.push('');

      if (table.columns.length === 0) {
        lines.push('*(no columns)*');
        lines.push('');
        continue;
      }

      // Columns table
      lines.push('| Name | Type | Nullable | Default | Constraints |');
      lines.push('|------|------|----------|---------|-------------|');
      
      for (const col of table.columns) {
        const constraints: string[] = [];
        if (col.isPrimaryKey) {
          constraints.push('PK');
        }
        if (col.isUnique && !col.isPrimaryKey) {
          constraints.push('UNIQUE');
        }
        
        const nullable = col.isNullable ? 'Yes' : '**No**';
        const defaultValue = col.defaultValue ? `\`${col.defaultValue}\`` : '-';
        const constraintsStr = constraints.length > 0 ? constraints.join(', ') : '-';
        
        lines.push(`| ${col.name} | \`${col.dataType}\` | ${nullable} | ${defaultValue} | ${constraintsStr} |`);
      }
      lines.push('');

      // Primary key
      if (table.primaryKey) {
        lines.push(`**Primary Key:** \`${table.primaryKey.name}\` (${table.primaryKey.columns.join(', ')})`);
        lines.push('');
      }

      // Unique constraints (multi-column)
      if (includeConstraints && table.uniqueConstraints.length > 0) {
        const multiColumnUniques = table.uniqueConstraints.filter(u => u.columns.length > 1);
        if (multiColumnUniques.length > 0) {
          lines.push('**Unique Constraints:**');
          for (const unique of multiColumnUniques) {
            lines.push(`- \`${unique.name}\`: (${unique.columns.join(', ')})`);
          }
          lines.push('');
        }
      }

      // Foreign keys
      if (includeConstraints && table.foreignKeys.length > 0) {
        lines.push('**Foreign Keys:**');
        for (const fk of table.foreignKeys) {
          const refTable = fk.referencedSchema !== table.schema 
            ? `\`${fk.referencedSchema}.${fk.referencedTable}\``
            : `\`${fk.referencedTable}\``;
          const actions: string[] = [];
          if (fk.onDelete && fk.onDelete !== 'NO ACTION') {
            actions.push(`ON DELETE ${fk.onDelete}`);
          }
          if (fk.onUpdate && fk.onUpdate !== 'NO ACTION') {
            actions.push(`ON UPDATE ${fk.onUpdate}`);
          }
          const actionsStr = actions.length > 0 ? ` ${actions.join(' ')}` : '';
          lines.push(`- \`${fk.name}\`: (${fk.columns.join(', ')}) → ${refTable}(${fk.referencedColumns.join(', ')})${actionsStr}`);
        }
        lines.push('');
      }

      // Indexes
      if (includeIndexes && table.indexes.length > 0) {
        lines.push('**Indexes:**');
        for (const idx of table.indexes) {
          const uniqueLabel = idx.isUnique ? ' [UNIQUE]' : '';
          lines.push(`- \`${idx.name}\`: (${idx.columns.join(', ')})${uniqueLabel} [${idx.type}]`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

