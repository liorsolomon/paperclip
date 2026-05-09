import { and, desc, eq, ilike, sql } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { assets } from "@paperclipai/db";

export function assetService(db: Db) {
  return {
    create: (companyId: string, data: Omit<typeof assets.$inferInsert, "companyId">) =>
      db
        .insert(assets)
        .values({ ...data, companyId })
        .returning()
        .then((rows) => rows[0]),

    getById: (id: string) =>
      db
        .select()
        .from(assets)
        .where(eq(assets.id, id))
        .then((rows) => rows[0] ?? null),

    listByCompany: async (companyId: string, opts: { q?: string; page?: number; perPage?: number }) => {
      const page = Math.max(1, opts.page ?? 1);
      const perPage = Math.min(opts.perPage ?? 50, 200);
      const offset = (page - 1) * perPage;

      const where = opts.q
        ? and(eq(assets.companyId, companyId), ilike(assets.originalFilename, `%${opts.q}%`))
        : eq(assets.companyId, companyId);

      const [rows, [countRow]] = await Promise.all([
        db
          .select()
          .from(assets)
          .where(where)
          .orderBy(desc(assets.createdAt))
          .limit(perPage)
          .offset(offset),
        db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(assets)
          .where(where),
      ]);

      return { files: rows, total: countRow?.count ?? 0, page, perPage };
    },

    deleteById: async (id: string, companyId: string) => {
      const [deleted] = await db
        .delete(assets)
        .where(and(eq(assets.id, id), eq(assets.companyId, companyId)))
        .returning();
      return deleted ?? null;
    },
  };
}

