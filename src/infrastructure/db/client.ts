/**
 * PSCVault Client Database Adapter
 * Provides a clean execution interface over Tauri SQL Plugin with an in-memory/localStorage fallback
 * for browser dev environments.
 */

interface DBClient {
  select<T = any>(query: string, params?: any[]): Promise<T>;
  execute(query: string, params?: any[]): Promise<{ rowsAffected: number; lastInsertId?: number }>;
}

let dbClientInstance: DBClient | null = null;
let isTauriEnv = false;

// Check if running inside Tauri webview
try {
  isTauriEnv = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
} catch {
  isTauriEnv = false;
}

function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
}

// In-Memory Storage Engine for Browser fallback
class LocalStorageFallbackDB implements DBClient {
  private tables: Record<string, Record<string, any>> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem('pscvault_local_db');
      if (data) {
        this.tables = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Fallback DB load failed', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('pscvault_local_db', JSON.stringify(this.tables));
    } catch (e) {
      console.warn('Fallback DB save failed', e);
    }
  }

  async select<T = any>(query: string, params: any[] = []): Promise<T> {
    const fromMatch = query.match(/FROM\s+("?\w+"?\.)?"?(\w+)"?/i);
    if (!fromMatch) return [] as unknown as T;

    const tableName = fromMatch[2];
    const table = this.tables[tableName] || {};
    let rows = Object.values(table);

    // Extract selected columns from SELECT clause
    const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i);
    let selectedCols: string[] = [];
    if (selectMatch) {
      const rawCols = selectMatch[1];
      if (rawCols.trim() !== '*') {
        selectedCols = [...rawCols.matchAll(/("?\w+"?\.)?"?(\w+)"?/g)].map(m => m[2]);
      }
    }

    // Filter out deleted_at unless explicitly querying soft deleted items
    if (!query.includes('deleted_at IS NOT NULL') && !query.includes('"deleted_at" IS NOT NULL')) {
      rows = rows.filter(r => !r.deleted_at && !r.deletedAt);
    }

    // Match WHERE parameter bindings ($1, $2...)
    const whereIdx = query.toUpperCase().indexOf('WHERE');
    if (whereIdx !== -1) {
      const whereClause = query.slice(whereIdx);
      const paramMatches = [...whereClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s*=\s*\$(\d+)/g)];
      if (paramMatches.length > 0 && params.length > 0) {
        paramMatches.forEach(pm => {
          const col = pm[2];
          const paramIdx = parseInt(pm[3], 10) - 1;
          if (paramIdx >= 0 && paramIdx < params.length) {
            const val = params[paramIdx];
            rows = rows.filter(r => r[col] === val || r[col] == val || r[camelCase(col)] === val);
          }
        });
      }
    }

    // Project columns to match exact requested SELECT order
    if (selectedCols.length > 0) {
      rows = rows.map(r => {
        const projected: Record<string, any> = {};
        selectedCols.forEach(col => {
          projected[col] = r[col] !== undefined ? r[col] : r[camelCase(col)];
        });
        return projected;
      });
    }

    return rows as unknown as T;
  }

  async execute(query: string, params: any[] = []): Promise<{ rowsAffected: number; lastInsertId?: number }> {
    const trimmed = query.trim();

    // 1. INSERT Handler
    const insertMatch = trimmed.match(/INSERT\s+INTO\s+("?\w+"?\.)?"?(\w+)"?\s*\((.*?)\)\s*VALUES/i);
    if (insertMatch) {
      const tableName = insertMatch[2];
      const cols = insertMatch[3].split(',').map(c => c.trim().replace(/"/g, ''));
      if (!this.tables[tableName]) this.tables[tableName] = {};

      const row: Record<string, any> = {};
      cols.forEach((col, idx) => {
        row[col] = params[idx];
        row[camelCase(col)] = params[idx];
      });

      const id = row.id || `fallback_${Date.now()}_${Math.random()}`;
      this.tables[tableName][id] = row;
      this.saveToStorage();
      return { rowsAffected: 1 };
    }

    // 2. UPDATE Handler
    if (trimmed.toUpperCase().startsWith('UPDATE')) {
      const tableMatch = trimmed.match(/UPDATE\s+("?\w+"?\.)?"?(\w+)"?/i);
      if (tableMatch) {
        const tableName = tableMatch[2];
        if (this.tables[tableName]) {
          const setMatch = trimmed.match(/SET\s+(.*?)\s+WHERE/i);
          const setClause = setMatch ? setMatch[1] : '';
          const setAssignments = setClause.split(',');

          const whereIdx = trimmed.toUpperCase().indexOf('WHERE');
          const whereClause = whereIdx !== -1 ? trimmed.slice(whereIdx) : '';
          const paramMatches = [...whereClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s*=\s*\$(\d+)/g)];

          let count = 0;
          Object.values(this.tables[tableName]).forEach(row => {
            let matchesWhere = true;
            if (paramMatches.length > 0) {
              matchesWhere = paramMatches.every(pm => {
                const col = pm[2];
                const pIdx = parseInt(pm[3], 10) - 1;
                if (pIdx >= 0 && pIdx < params.length) {
                  const val = params[pIdx];
                  return row[col] === val || row[col] == val || row[camelCase(col)] === val;
                }
                return true;
              });
            }

            if (matchesWhere) {
              setAssignments.forEach(assign => {
                const parts = assign.split('=');
                if (parts.length === 2) {
                  const field = parts[0].trim().replace(/("?\w+"?\.)?"?/g, '').replace(/"/g, '');
                  const pMatch = parts[1].trim().match(/\$(\d+)/);
                  if (pMatch) {
                    const pIdx = parseInt(pMatch[1], 10) - 1;
                    if (pIdx >= 0 && pIdx < params.length) {
                      row[field] = params[pIdx];
                      row[camelCase(field)] = params[pIdx];
                    }
                  } else if (parts[1].trim().toUpperCase() === 'NULL') {
                    row[field] = null;
                    row[camelCase(field)] = null;
                  }
                }
              });
              count++;
            }
          });

          this.saveToStorage();
          return { rowsAffected: count };
        }
      }
    }

    // 3. DELETE Handler
    if (trimmed.toUpperCase().startsWith('DELETE')) {
      const tableMatch = trimmed.match(/DELETE\s+FROM\s+("?\w+"?\.)?"?(\w+)"?/i);
      if (tableMatch) {
        const tableName = tableMatch[2];
        if (this.tables[tableName]) {
          const whereIdx = trimmed.toUpperCase().indexOf('WHERE');
          const whereClause = whereIdx !== -1 ? trimmed.slice(whereIdx) : '';
          const paramMatches = [...whereClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s*=\s*\$(\d+)/g)];

          let count = 0;
          Object.keys(this.tables[tableName]).forEach(key => {
            const row = this.tables[tableName][key];
            let matchesWhere = true;
            if (paramMatches.length > 0) {
              matchesWhere = paramMatches.every(pm => {
                const col = pm[2];
                const pIdx = parseInt(pm[3], 10) - 1;
                if (pIdx >= 0 && pIdx < params.length) {
                  const val = params[pIdx];
                  return row[col] === val || row[col] == val || row[camelCase(col)] === val;
                }
                return true;
              });
            }

            if (matchesWhere) {
              delete this.tables[tableName][key];
              count++;
            }
          });

          this.saveToStorage();
          return { rowsAffected: count };
        }
      }
    }

    return { rowsAffected: 0 };
  }
}

export async function getDBClient(): Promise<DBClient> {
  if (dbClientInstance) return dbClientInstance;

  if (isTauriEnv) {
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      const tauriDb = await Database.load('sqlite:pscvault.db');
      dbClientInstance = {
        async select<T = any>(query: string, params?: any[]): Promise<T> {
          return tauriDb.select<T>(query, params);
        },
        async execute(query: string, params?: any[]): Promise<{ rowsAffected: number }> {
          const res = await tauriDb.execute(query, params);
          return { rowsAffected: res.rowsAffected };
        }
      };
      return dbClientInstance;
    } catch (e) {
      console.warn('Tauri SQL plugin load failed, using fallback:', e);
    }
  }

  dbClientInstance = new LocalStorageFallbackDB();
  return dbClientInstance;
}
