import { describe, it, expect } from 'vitest';
import { renderConsole } from '../src/output/consoleRenderer.js';
import { renderMarkdown } from '../src/output/markdownRenderer.js';
import { renderJson } from '../src/output/jsonRenderer.js';
import { renderMermaid } from '../src/output/mermaidRenderer.js';
import type { PgSchemaModel } from '../src/schema/types.js';

const sampleSchema: PgSchemaModel = {
  schemas: ['public'],
  tables: [
    {
      schema: 'public',
      name: 'users',
      kind: 'table',
      columns: [
        {
          name: 'id',
          dataType: 'integer',
          isNullable: false,
          defaultValue: "nextval('users_id_seq'::regclass)",
          isPrimaryKey: true,
          isUnique: false,
        },
        {
          name: 'email',
          dataType: 'character varying',
          isNullable: false,
          defaultValue: null,
          isPrimaryKey: false,
          isUnique: true,
        },
        {
          name: 'created_at',
          dataType: 'timestamp without time zone',
          isNullable: false,
          defaultValue: 'now()',
          isPrimaryKey: false,
          isUnique: false,
        },
      ],
      primaryKey: {
        name: 'users_pkey',
        columns: ['id'],
      },
      uniqueConstraints: [
        {
          name: 'users_email_key',
          columns: ['email'],
        },
      ],
      foreignKeys: [],
      indexes: [
        {
          name: 'idx_users_email',
          columns: ['email'],
          isUnique: false,
          type: 'btree',
        },
      ],
    },
    {
      schema: 'public',
      name: 'orders',
      kind: 'table',
      columns: [
        {
          name: 'id',
          dataType: 'integer',
          isNullable: false,
          defaultValue: null,
          isPrimaryKey: true,
          isUnique: false,
        },
        {
          name: 'user_id',
          dataType: 'integer',
          isNullable: false,
          defaultValue: null,
          isPrimaryKey: false,
          isUnique: false,
        },
        {
          name: 'total',
          dataType: 'numeric',
          isNullable: true,
          defaultValue: null,
          isPrimaryKey: false,
          isUnique: false,
        },
      ],
      primaryKey: {
        name: 'orders_pkey',
        columns: ['id'],
      },
      uniqueConstraints: [],
      foreignKeys: [
        {
          name: 'orders_user_id_fkey',
          columns: ['user_id'],
          referencedTable: 'users',
          referencedSchema: 'public',
          referencedColumns: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'NO ACTION',
        },
      ],
      indexes: [],
    },
  ],
};

describe('Console Renderer', () => {
  it('should render schema with tables and columns', () => {
    const output = renderConsole(sampleSchema, false, false);
    expect(output).toContain('Schema: public');
    expect(output).toContain('users');
    expect(output).toContain('orders');
    expect(output).toContain('id');
    expect(output).toContain('email');
  });

  it('should include indexes when flag is set', () => {
    const output = renderConsole(sampleSchema, true, false);
    expect(output).toContain('Indexes:');
    expect(output).toContain('idx_users_email');
  });

  it('should include foreign keys when flag is set', () => {
    const output = renderConsole(sampleSchema, false, true);
    expect(output).toContain('Foreign Keys:');
    expect(output).toContain('orders_user_id_fkey');
    expect(output).toContain('users');
    expect(output).toContain('CASCADE');
  });
});

describe('Markdown Renderer', () => {
  it('should generate markdown with proper structure', () => {
    const output = renderMarkdown(sampleSchema, false, false);
    expect(output).toContain('# Database Schema');
    expect(output).toContain('## Schema: public');
    expect(output).toContain('### Table: users');
    expect(output).toContain('| Name | Type | Nullable | Default | Constraints |');
  });

  it('should include primary key information', () => {
    const output = renderMarkdown(sampleSchema, false, true);
    expect(output).toContain('**Primary Key:**');
    expect(output).toContain('users_pkey');
  });

  it('should include foreign keys when flag is set', () => {
    const output = renderMarkdown(sampleSchema, false, true);
    expect(output).toContain('**Foreign Keys:**');
    expect(output).toContain('orders_user_id_fkey');
    expect(output).toContain('ON DELETE CASCADE');
  });

  it('should include indexes when flag is set', () => {
    const output = renderMarkdown(sampleSchema, true, false);
    expect(output).toContain('**Indexes:**');
    expect(output).toContain('idx_users_email');
  });
});

describe('JSON Renderer', () => {
  it('should serialize schema to JSON', () => {
    const output = renderJson(sampleSchema);
    const parsed = JSON.parse(output);
    
    expect(parsed.schemas).toEqual(['public']);
    expect(parsed.tables).toHaveLength(2);
    expect(parsed.tables[0].name).toBe('users');
    expect(parsed.tables[0].columns).toHaveLength(3);
    expect(parsed.tables[0].primaryKey).toBeDefined();
  });

  it('should preserve all schema data', () => {
    const output = renderJson(sampleSchema);
    const parsed = JSON.parse(output);
    
    const ordersTable = parsed.tables.find((t: { name: string }) => t.name === 'orders');
    expect(ordersTable).toBeDefined();
    expect(ordersTable.foreignKeys).toHaveLength(1);
    expect(ordersTable.foreignKeys[0].onDelete).toBe('CASCADE');
  });
});

describe('Mermaid Renderer', () => {
  it('should generate mermaid ER diagram', () => {
    const output = renderMermaid(sampleSchema, false);
    expect(output).toContain('erDiagram');
    expect(output).toContain('users {');
    expect(output).toContain('orders {');
  });

  it('should include column details when not relationships-only', () => {
    const output = renderMermaid(sampleSchema, false);
    expect(output).toContain('integer id');
    expect(output).toContain('character varying email');
    expect(output).toContain('PK');
  });

  it('should show relationships', () => {
    const output = renderMermaid(sampleSchema, false);
    expect(output).toContain('orders');
    expect(output).toContain('users');
    // Should have a relationship line
    expect(output).toMatch(/orders\s+.*\s+users/);
  });

  it('should simplify output when relationships-only is true', () => {
    const output = renderMermaid(sampleSchema, true);
    expect(output).toContain('erDiagram');
    expect(output).toContain('users {');
    expect(output).toContain('orders {');
    // Should not have detailed column info
    expect(output).not.toContain('integer id');
  });
});

