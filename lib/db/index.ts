import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
 
// 使用 Proxy 进行深度懒加载，确保构建时完全不初始化数据库
const globalForDb = global as unknown as { db: any };
 
function createDb() {
  if (!globalForDb.db) {
    // 强制使用动态 require，避免 Next.js 静态分析尝试捆绑它
    const Database = require("better-sqlite3");
    const sqlite = new Database("sqlite.db");
    globalForDb.db = drizzle(sqlite, { schema });
  }
  return globalForDb.db;
}
 
// 导出一个 Proxy，只有在被调用属性时才触发初始化
export const db = new Proxy({} as any, {
  get(target, prop) {
    const instance = createDb();
    return (instance as any)[prop];
  }
});
