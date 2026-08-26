// In-Memory Cloud Database Engine Fallback for Server Testing & Standalone Mode
export class MongoMemoryEngine {
  private collections: Record<string, Record<string, any>> = {
    users: {},
    workspaces: {},
    notebooks: {},
    section_groups: {},
    sections: {},
    pages: {},
    attachments: {},
    tags: {},
    page_tags: {},
    sync_changes: {},
    user_cursors: {},
  };

  public getCollection(name: string) {
    if (!this.collections[name]) this.collections[name] = {};
    return this.collections[name];
  }

  public async findOne(collectionName: string, query: Record<string, any>) {
    const col = this.getCollection(collectionName);
    const rows = Object.values(col);
    return rows.find(row => this.matchQuery(row, query)) || null;
  }

  public async find(collectionName: string, query: Record<string, any>) {
    const col = this.getCollection(collectionName);
    const rows = Object.values(col);
    return rows.filter(row => this.matchQuery(row, query));
  }

  public async create(collectionName: string, doc: Record<string, any>) {
    const col = this.getCollection(collectionName);
    const id = doc.id || doc.userId || doc.cursor || `doc_${Date.now()}_${Math.random()}`;
    const item = { ...doc, id, createdAt: doc.createdAt || new Date(), updatedAt: new Date() };
    col[id] = item;
    return item;
  }

  public async updateOne(collectionName: string, query: Record<string, any>, update: Record<string, any>, options?: { upsert?: boolean }) {
    const col = this.getCollection(collectionName);
    let row = await this.findOne(collectionName, query);
    if (!row && options?.upsert) {
      const docId = query.id || (update.$set && update.$set.id) || `doc_${Date.now()}_${Math.random()}`;
      row = { ...query, id: docId, createdAt: new Date() };
      col[docId] = row;
    }
    if (row) {
      if (update.$set) {
        Object.assign(row, update.$set);
      }
      row.updatedAt = new Date();
      if (row.id) col[row.id] = row;
    }
    return row;
  }

  public async updateMany(collectionName: string, query: Record<string, any>, update: Record<string, any>) {
    const col = this.getCollection(collectionName);
    const rows = Object.values(col).filter(r => this.matchQuery(r, query));
    rows.forEach(r => {
      if (update.$set) {
        Object.assign(r, update.$set);
      }
      r.updatedAt = new Date();
    });
    return rows.length;
  }

  public async deleteMany(collectionName: string, query: Record<string, any>) {
    const col = this.getCollection(collectionName);
    Object.keys(col).forEach(k => {
      if (this.matchQuery(col[k], query)) {
        delete col[k];
      }
    });
  }

  public async deleteOne(collectionName: string, query: Record<string, any>) {
    const col = this.getCollection(collectionName);
    const key = Object.keys(col).find(k => this.matchQuery(col[k], query));
    if (key) delete col[key];
  }

  private matchQuery(row: Record<string, any>, query: Record<string, any>): boolean {
    for (const key of Object.keys(query)) {
      const val = query[key];
      if (key === '$or' && Array.isArray(val)) {
        const matchesOr = val.some(subQ => this.matchQuery(row, subQ));
        if (!matchesOr) return false;
        continue;
      }
      if (key === '$in' && Array.isArray(val)) {
        if (!val.includes(row[key])) return false;
        continue;
      }
      if (key === 'deletedAt' && val && typeof val === 'object' && val.$ne !== undefined) {
        if (row.deletedAt === null || row.deletedAt === undefined) return false;
        continue;
      }
      if (key === 'cursor' && val && typeof val === 'object' && val.$gt !== undefined) {
        if (row.cursor <= val.$gt) return false;
        continue;
      }
      if (row[key] !== val && String(row[key]) !== String(val)) {
        if (val === null && (row[key] === null || row[key] === undefined)) continue;
        return false;
      }
    }
    return true;
  }
}

export const memoryMongo = new MongoMemoryEngine();
