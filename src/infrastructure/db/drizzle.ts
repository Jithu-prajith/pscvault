import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { getDBClient } from './client';
import * as schema from './schema';

export const db = drizzle(
  async (sql, params, method) => {
    const client = await getDBClient();
    try {
      if (method === 'all') {
        const rows = await client.select<Record<string, any>[]>(sql, params);
        return { rows: (rows || []).map(row => Object.values(row)) };
      } else if (method === 'get') {
        const rows = await client.select<Record<string, any>[]>(sql, params);
        return { rows: rows && rows.length > 0 ? [Object.values(rows[0])] : [] };
      } else {
        await client.execute(sql, params);
        return { rows: [] };
      }
    } catch (e) {
      console.error('Drizzle execution error:', sql, params, e);
      return { rows: [] };
    }
  },
  { schema }
);
