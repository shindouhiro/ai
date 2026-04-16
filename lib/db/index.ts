import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";
import path from "node:path";

type Db = NodePgDatabase<typeof schema>;

// 使用 Proxy 进行懒加载，避免构建阶段访问数据库
const globalForDb = global as unknown as {
  db: Db | undefined;
  pool: Pool | undefined;
};

async function runMigrations(db: Db) {
  if (process.env.NODE_ENV === "production") {
    console.log("⏳ Running migrations...");
    try {
      await migrate(db, {
        migrationsFolder: path.join(process.cwd(), "drizzle"),
      });
      console.log("✅ Migrations completed");
    } catch (error) {
      console.error("❌ Migration failed:", error);
    }
  }
}

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
    
    // 在生产环境异步运行迁移
    if (process.env.NODE_ENV === "production") {
      runMigrations(globalForDb.db);
    }
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
