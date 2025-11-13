import { PgSchemaModel } from '../schema/types.js';

export function renderJson(schema: PgSchemaModel): string {
  return JSON.stringify(schema, null, 2);
}

