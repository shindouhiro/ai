import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
 
// 使用 Proxy 进行深度懒加载，确保构建时完全不初始化数据库
const globalForDb = global as unknown as { db: any };
 
function createDb() {
  if (!globalForDb.db) {
    // 究极方案：使用 eval('require') 绕过 Webpack 所有对其内容的静态扫描
    // 确保在运行时它被当做一个纯粹的系统环境 require 运行
    try {
      const Database = eval('require("better-sqlite3")');
      const sqlite = new Database("sqlite.db");
      globalForDb.db = drizzle(sqlite, { schema });
    } catch (e) {
      console.error("Database initialization failed:", e);
      throw e;
    }
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
