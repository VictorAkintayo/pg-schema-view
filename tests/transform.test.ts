import { describe, it, expect } from 'vitest';
import { transformSchema } from '../src/schema/transform.js';
import type { IntrospectionResult } from '../src/db/introspect.js';

describe('transformSchema', () => {
  it('should transform raw schema data into normalized model', () => {
    const raw: IntrospectionResult = {
      tables: [
        { schema: 'public', name: 'users', kind: 'table' },
      ],
      columns: [
        {
          schema: 'public',
          table_name: 'users',
          column_name: 'id',
          data_type: 'integer',
          is_nullable: 'NO',
          column_default: "nextval('users_id_seq'::regclass)",
          ordinal_position: 1,
        },
        {
          schema: 'public',
          table_name: 'users',
          column_name: 'email',
          data_type: 'character varying',
          is_nullable: 'NO',
          column_default: null,
          ordinal_position: 2,
        },
      ],
      primaryKeys: [
        {
          schema: 'public',
          table_name: 'users',
          constraint_name: 'users_pkey',
          column_name: 'id',
          ordinal_position: 1,
        },
      ],
      uniqueConstraints: [
        {
          schema: 'public',
          table_name: 'users',
          constraint_name: 'users_email_key',
          column_name: 'email',
          ordinal_position: 1,
        },
      ],
      foreignKeys: [],
      indexes: [],
    };

    const result = transformSchema(raw, false, true);

    expect(result.schemas).toEqual(['public']);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe('users');
    expect(result.tables[0].columns).toHaveLength(2);
    expect(result.tables[0].primaryKey).toBeDefined();
    expect(result.tables[0].primaryKey?.columns).toEqual(['id']);
    expect(result.tables[0].columns[0].isPrimaryKey).toBe(true);
    expect(result.tables[0].columns[1].isUnique).toBe(true);
  });

  it('should handle foreign keys correctly', () => {
    const raw: IntrospectionResult = {
      tables: [
        { schema: 'public', name: 'users', kind: 'table' },
        { schema: 'public', name: 'orders', kind: 'table' },
      ],
      columns: [
        { schema: 'public', table_name: 'users', column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null, ordinal_position: 1 },
        { schema: 'public', table_name: 'orders', column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null, ordinal_position: 1 },
        { schema: 'public', table_name: 'orders', column_name: 'user_id', data_type: 'integer', is_nullable: 'NO', column_default: null, ordinal_position: 2 },
      ],
      primaryKeys: [
        { schema: 'public', table_name: 'users', constraint_name: 'users_pkey', column_name: 'id', ordinal_position: 1 },
        { schema: 'public', table_name: 'orders', constraint_name: 'orders_pkey', column_name: 'id', ordinal_position: 1 },
      ],
      uniqueConstraints: [],
      foreignKeys: [
        {
          schema: 'public',
          table_name: 'orders',
          constraint_name: 'orders_user_id_fkey',
          column_name: 'user_id',
          ordinal_position: 1,
          referenced_schema: 'public',
          referenced_table: 'users',
          referenced_column: 'id',
          on_update: 'NO ACTION',
          on_delete: 'CASCADE',
        },
      ],
      indexes: [],
    };

    const result = transformSchema(raw, false, true);

    const ordersTable = result.tables.find(t => t.name === 'orders');
    expect(ordersTable).toBeDefined();
    expect(ordersTable?.foreignKeys).toHaveLength(1);
    expect(ordersTable?.foreignKeys[0].referencedTable).toBe('users');
    expect(ordersTable?.foreignKeys[0].onDelete).toBe('CASCADE');
  });
});

