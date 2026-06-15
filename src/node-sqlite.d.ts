declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...args: unknown[]): { changes: number; lastInsertRowid: number | bigint };
      get(...args: unknown[]): any;
      all(...args: unknown[]): any[];
    };
    close(): void;
  }
}
