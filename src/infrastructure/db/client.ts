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

  private matchesWhere(row: Record<string, any>, query: string, params: any[], paramOffset = 0): boolean {
    const whereIdx = query.toUpperCase().indexOf('WHERE');
    if (whereIdx === -1) return true;

    const whereClause = query.slice(whereIdx);

    // 1. Check parameter equality ($1, $2...) or (?)
    const paramMatches = [...whereClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s*=\s*(\$(\d+)|\?)/g)];
    let paramCounter = paramOffset;

    for (const pm of paramMatches) {
      const col = pm[2];
      const pIdxStr = pm[4];
      const pIdx = pIdxStr ? parseInt(pIdxStr, 10) - 1 : paramCounter++;

      if (pIdx >= 0 && pIdx < params.length) {
        const val = params[pIdx];
        const rVal = row[col] !== undefined ? row[col] : row[camelCase(col)];
        if (rVal !== val && String(rVal) !== String(val)) {
          return false;
        }
      }
    }

    // 2. Check IS NULL conditions (e.g. deleted_at IS NULL)
    const isNullMatches = [...whereClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s+IS\s+NULL/gi)];
    for (const pm of isNullMatches) {
      const col = pm[2];
      const rVal = row[col] !== undefined ? row[col] : row[camelCase(col)];
      if (rVal !== null && rVal !== undefined) {
        return false;
      }
    }

    // 3. Check IS NOT NULL conditions (e.g. deleted_at IS NOT NULL)
    const isNotNullMatches = [...whereClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s+IS\s+NOT\s+NULL/gi)];
    for (const pm of isNotNullMatches) {
      const col = pm[2];
      const rVal = row[col] !== undefined ? row[col] : row[camelCase(col)];
      if (rVal === null || rVal === undefined) {
        return false;
      }
    }

    return true;
  }

  async select<T = any>(query: string, params: any[] = []): Promise<T> {
    const fromMatch = query.match(/FROM\s+("?\w+"?\.)?"?(\w+)"?/i);
    if (!fromMatch) return [] as unknown as T;

    const tableName = fromMatch[2];
    const table = this.tables[tableName] || {};
    let rows = Object.values(table);

    // Handle INNER JOIN if present
    const joinMatches = [...query.matchAll(/INNER\s+JOIN\s+("?\w+"?\.)?"?(\w+)"?\s+ON\s+("?\w+"?\.)?"?(\w+)"?\s*=\s*("?\w+"?\.)?"?(\w+)"?/gi)];
    if (joinMatches.length > 0) {
      joinMatches.forEach(jm => {
        const joinTableName = jm[2];
        const leftCol = jm[4];
        const rightCol = jm[6];

        const joinTable = this.tables[joinTableName] || {};
        const joinRows = Object.values(joinTable);

        const joined: Record<string, any>[] = [];
        rows.forEach(r1 => {
          const leftVal = r1[leftCol] !== undefined ? r1[leftCol] : r1[camelCase(leftCol)];
          joinRows.forEach(r2 => {
            const rightVal = r2[rightCol] !== undefined ? r2[rightCol] : r2[camelCase(rightCol)];
            if (leftVal !== undefined && (leftVal === rightVal || String(leftVal) === String(rightVal))) {
              joined.push({ ...r2, ...r1 }); // Merged row attributes
            }
          });
        });
        rows = joined;
      });
    }

    // Filter rows according to WHERE clause
    rows = rows.filter(r => this.matchesWhere(r, query, params, 0));

    // Extract selected columns from SELECT clause
    const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i);
    let selectedCols: string[] = [];
    if (selectMatch) {
      const rawCols = selectMatch[1];
      if (rawCols.trim() !== '*') {
        selectedCols = [...rawCols.matchAll(/("?\w+"?\.)?"?(\w+)"?/g)].map(m => m[2]);
      }
    }

    // Project columns to match exact requested SELECT order expected by Drizzle ORM positional decoder
    if (selectedCols.length > 0) {
      rows = rows.map(r => {
        const projected: Record<string, any> = {};
        selectedCols.forEach(col => {
          const val = r[col] !== undefined ? r[col] : r[camelCase(col)];
          projected[col] = val !== undefined ? val : null;
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
          const setIdx = trimmed.toUpperCase().indexOf('SET');
          const whereIdx = trimmed.toUpperCase().indexOf('WHERE');
          const setClause = setIdx !== -1 ? trimmed.slice(setIdx + 3, whereIdx !== -1 ? whereIdx : undefined) : '';

          const setAssignments = [...setClause.matchAll(/("?\w+"?\.)?"?(\w+)"?\s*=\s*(\$(\d+)|\?|NULL|'[^']*'|"[^"]*"\s*\+\s*\d+|\w+\s*\+\s*\d+|\d+)/gi)];
          let paramCounter = 0;
          const setParamCount = setAssignments.filter(a => a[3] === '?' || a[4] !== undefined).length;

          let count = 0;
          Object.values(this.tables[tableName]).forEach(row => {
            if (this.matchesWhere(row, trimmed, params, setParamCount)) {
              paramCounter = 0;
              setAssignments.forEach(assign => {
                const field = assign[2];
                const valExpr = assign[3].toUpperCase();
                const pIdxStr = assign[4];

                if (pIdxStr) {
                  const pIdx = parseInt(pIdxStr, 10) - 1;
                  if (pIdx >= 0 && pIdx < params.length) {
                    row[field] = params[pIdx];
                    row[camelCase(field)] = params[pIdx];
                  }
                } else if (valExpr === '?') {
                  const pIdx = paramCounter++;
                  if (pIdx < params.length) {
                    row[field] = params[pIdx];
                    row[camelCase(field)] = params[pIdx];
                  }
                } else if (valExpr === 'NULL') {
                  row[field] = null;
                  row[camelCase(field)] = null;
                } else if (valExpr.includes('+')) {
                  const currentVal = Number(row[field] || row[camelCase(field)] || 1);
                  row[field] = currentVal + 1;
                  row[camelCase(field)] = currentVal + 1;
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
          let count = 0;
          Object.keys(this.tables[tableName]).forEach(key => {
            const row = this.tables[tableName][key];
            if (this.matchesWhere(row, trimmed, params, 0)) {
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
