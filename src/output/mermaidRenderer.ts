import { PgSchemaModel, PgTable } from '../schema/types.js';

export function renderMermaid(schema: PgSchemaModel, relationshipsOnly: boolean): string {
  const lines: string[] = [];
  lines.push('erDiagram');
  lines.push('');

  // Build table definitions
  if (!relationshipsOnly) {
    for (const table of schema.tables) {
      lines.push(`  ${table.name} {`);
      
      for (const col of table.columns) {
        const type = col.dataType.toLowerCase();
        const constraints: string[] = [];
        if (col.isPrimaryKey) {
          constraints.push('PK');
        }
        if (col.isUnique && !col.isPrimaryKey) {
          constraints.push('UK');
        }
        const constraintStr = constraints.length > 0 ? ` ${constraints.join(',')}` : '';
        const nullable = col.isNullable ? '' : ' "NOT NULL"';
        
        lines.push(`    ${type} ${col.name}${constraintStr}${nullable}`);
      }
      
      lines.push('  }');
      lines.push('');
    }
  } else {
    // Just list table names
    for (const table of schema.tables) {
      lines.push(`  ${table.name} {`);
      lines.push('  }');
      lines.push('');
    }
  }

  // Build relationships
  const relationships = new Set<string>();
  
  for (const table of schema.tables) {
    for (const fk of table.foreignKeys) {
      const sourceTable = table.name;
      const targetTable = fk.referencedTable;
      
      // Avoid duplicate relationships
      const relKey = `${sourceTable}->${targetTable}`;
      if (relationships.has(relKey)) {
        continue;
      }
      relationships.add(relKey);

      // Determine cardinality (simplified - assumes many-to-one)
      const cardinality = '||--o{';
      const label = fk.name.replace(/^fk_/, '').replace(/_/g, ' ');
      
      lines.push(`  ${sourceTable} ${cardinality} ${targetTable} : "${label}"`);
    }
  }

  return lines.join('\n');
}

