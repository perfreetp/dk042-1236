import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import seedData from './seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../../data/promptshare.db');
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const DATA_DIR = path.join(__dirname, '../../data');

class DatabaseService {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private async loadWasm(): Promise<void> {
    if (this.SQL) return;
    
    this.SQL = await initSqlJs({
      locateFile: (file: string) => `./node_modules/sql.js/dist/${file}`
    });
  }

  private loadExistingDatabase(): Uint8Array | undefined {
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      return new Uint8Array(fileBuffer);
    }
    return undefined;
  }

  private saveDatabase(): void {
    if (!this.db) return;
    
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  private getMigrationFiles(): string[] {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      return [];
    }
    return fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();
  }

  private runMigrations(): void {
    if (!this.db) throw new Error('Database not initialized');

    const migrationFiles = this.getMigrationFiles();
    
    this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const executedMigrations = this.db
      .exec('SELECT name FROM migrations')
      .flatMap((result) => result.values.map((row) => row[0] as string));

    for (const file of migrationFiles) {
      if (executedMigrations.includes(file)) {
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      try {
        this.db.run(sql);
        this.db.run('INSERT INTO migrations (name) VALUES (?)', [file]);
        console.log(`Migration executed: ${file}`);
      } catch (error) {
        console.error(`Error executing migration ${file}:`, error);
        throw error;
      }
    }

    this.saveDatabase();
  }

  private isDatabaseEmpty(): boolean {
    if (!this.db) return true;
    
    const result = this.db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'migrations'
    `);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return true;
    }

    const userCount = this.db.exec('SELECT COUNT(*) as count FROM users');
    return userCount[0]?.values[0]?.[0] === 0;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadWasm();
    
    if (!this.SQL) {
      throw new Error('Failed to initialize sql.js');
    }

    const existingData = this.loadExistingDatabase();
    this.db = new this.SQL.Database(existingData);

    this.runMigrations();

    if (this.isDatabaseEmpty()) {
      await seedData(this.db);
      this.saveDatabase();
      console.log('Database seeded successfully');
    }

    this.isInitialized = true;
  }

  getDb(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  save(): void {
    this.saveDatabase();
  }

  close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  runQuery(sql: string, params: any[] = []): any {
    const database = this.getDb();
    const stmt = database.prepare(sql);
    const result = stmt.runAsObject(params);
    stmt.free();
    this.saveDatabase();
    return result;
  }

  getOne<T>(sql: string, params: any[] = []): T | null {
    const database = this.getDb();
    const stmt = database.prepare(sql);
    const result = stmt.getAsObject(params) as T | null;
    stmt.free();
    return result;
  }

  getMany<T>(sql: string, params: any[] = []): T[] {
    const database = this.getDb();
    const results = database.exec(sql, params);
    if (!results || results.length === 0) return [];

    const columns = results[0].columns;
    const values = results[0].values;

    return values.map(row => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj as T;
    });
  }

  initDatabase(): Promise<Database> {
    return this.init().then(() => this.getDb());
  }

  getDatabase(): Database {
    return this.getDb();
  }

}

export const dbService = new DatabaseService();
export default dbService;
