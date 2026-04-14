import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

// 使用 Proxy 进行懒加载，避免构建阶段访问数据库
const globalForDb = global as unknown as {
  db: Db | undefined;
  pool: Pool | undefined;
};

function createDb() {
  if (!globalForDb.db) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    globalForDb.pool ??= new Pool({
      connectionString,
      ssl:
        process.env.PGSSLMODE === "require"
          ? { rejectUnauthorized: false }
          : undefined,
    });

    globalForDb.db = drizzle(globalForDb.pool, { schema });
  }

  return globalForDb.db;
}

// 导出 Proxy，首次访问属性时才初始化
export const db = new Proxy({} as Db, {
  get(_, prop, receiver) {
    const instance = createDb();
    return Reflect.get(instance, prop, receiver);
  },
}) as Db;
