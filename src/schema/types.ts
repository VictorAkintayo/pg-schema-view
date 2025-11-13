export interface PgSchemaModel {
  schemas: string[];
  tables: PgTable[];
}

export interface PgTable {
  schema: string;
  name: string;
  kind: 'table' | 'view' | 'materialized_view';
  columns: PgColumn[];
  primaryKey?: PgPrimaryKey;
  uniqueConstraints: PgUniqueConstraint[];
  foreignKeys: PgForeignKey[];
  indexes: PgIndex[];
}

export interface PgColumn {
  name: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

export interface PgPrimaryKey {
  name: string;
  columns: string[];
}

export interface PgUniqueConstraint {
  name: string;
  columns: string[];
}

export interface PgForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedSchema: string;
  referencedColumns: string[];
  onUpdate?: string;
  onDelete?: string;
}

export interface PgIndex {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string; // btree, gin, gist, etc.
}

