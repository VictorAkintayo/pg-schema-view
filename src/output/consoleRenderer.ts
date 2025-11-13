import chalk from 'chalk';
import { PgSchemaModel, PgTable } from '../schema/types.js';

export function renderConsole(schema: PgSchemaModel, includeIndexes: boolean, includeConstraints: boolean): string {
  const lines: string[] = [];
  
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

    lines.push('');
    lines.push(chalk.bold.cyan(`Schema: ${schemaName}`));
    lines.push('');

    for (const table of tables) {
      const icon = table.kind === 'view' ? '👁️' : table.kind === 'materialized_view' ? '📊' : '📦';
      lines.push(chalk.bold(`${icon} ${table.name}`));
      
      if (table.columns.length === 0) {
        lines.push(chalk.gray('  (no columns)'));
        lines.push('');
        continue;
      }

      for (const col of table.columns) {
        const parts: string[] = [];
        parts.push(`  • ${chalk.white(col.name)}`);
        
        // Data type
        parts.push(chalk.gray(`(${col.dataType})`));
        
        // Nullability
        if (col.isNullable) {
          parts.push(chalk.dim('NULL'));
        } else {
          parts.push(chalk.yellowBright('NOT NULL'));
        }
        
        // Primary key
        if (col.isPrimaryKey) {
          parts.push(chalk.greenBright('PK'));
        }
        
        // Unique
        if (col.isUnique && !col.isPrimaryKey) {
          parts.push(chalk.cyanBright('UNIQUE'));
        }
        
        // Default value
        if (col.defaultValue) {
          parts.push(chalk.dim(`DEFAULT ${col.defaultValue}`));
        }
        
        lines.push(parts.join(' '));
      }

      // Indexes
      if (includeIndexes && table.indexes.length > 0) {
        lines.push('');
        lines.push(chalk.dim('  Indexes:'));
        for (const idx of table.indexes) {
          const idxParts: string[] = [];
          idxParts.push(`    ${chalk.cyan(idx.name)}`);
          idxParts.push(`(${idx.columns.join(', ')})`);
          if (idx.isUnique) {
            idxParts.push(chalk.cyanBright('[UNIQUE]'));
          }
          idxParts.push(chalk.dim(`[${idx.type}]`));
          lines.push(idxParts.join(' '));
        }
      }

      // Constraints
      if (includeConstraints) {
        // Unique constraints (multi-column)
        for (const unique of table.uniqueConstraints) {
          if (unique.columns.length > 1) {
            lines.push('');
            lines.push(chalk.dim(`  UNIQUE ${chalk.cyan(unique.name)}: (${unique.columns.join(', ')})`));
          }
        }

        // Foreign keys
        if (table.foreignKeys.length > 0) {
          lines.push('');
          lines.push(chalk.dim('  Foreign Keys:'));
          for (const fk of table.foreignKeys) {
            const fkParts: string[] = [];
            fkParts.push(`    ${chalk.magenta('FK')} ${chalk.cyan(fk.name)}:`);
            fkParts.push(`(${fk.columns.join(', ')})`);
            fkParts.push(chalk.white('→'));
            const refTable = fk.referencedSchema !== table.schema 
              ? `${fk.referencedSchema}.${fk.referencedTable}`
              : fk.referencedTable;
            fkParts.push(chalk.bold(`${refTable}(${fk.referencedColumns.join(', ')})`));
            
            const actions: string[] = [];
            if (fk.onDelete && fk.onDelete !== 'NO ACTION') {
              actions.push(`ON DELETE ${fk.onDelete}`);
            }
            if (fk.onUpdate && fk.onUpdate !== 'NO ACTION') {
              actions.push(`ON UPDATE ${fk.onUpdate}`);
            }
            if (actions.length > 0) {
              fkParts.push(chalk.dim(actions.join(' ')));
            }
            
            lines.push(fkParts.join(' '));
          }
        }
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

