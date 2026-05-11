import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import type { StorageService } from "../storage/types.js";

const { listByCompanyMock, getByIdMock, deleteByIdMock, logActivityMock } = vi.hoisted(() => ({
  listByCompanyMock: vi.fn(),
  getByIdMock: vi.fn(),
  deleteByIdMock: vi.fn(),
  logActivityMock: vi.fn(),
}));

function registerModuleMocks() {
  vi.doMock("../services/activity-log.js", () => ({
    logActivity: logActivityMock,
  }));
  vi.doMock("../services/assets.js", () => ({
    assetService: vi.fn(() => ({
      listByCompany: listByCompanyMock,
      getById: getByIdMock,
      deleteById: deleteByIdMock,
      create: vi.fn(),
    })),
  }));
  vi.doMock("../services/index.js", () => ({
    assetService: vi.fn(() => ({
      listByCompany: listByCompanyMock,
      getById: getByIdMock,
      deleteById: deleteByIdMock,
      create: vi.fn(),
    })),
    logActivity: logActivityMock,
  }));
}

function makeAsset(overrides: Partial<ReturnType<typeof baseAsset>> = {}) {
  return { ...baseAsset(), ...overrides };
}

function baseAsset() {
  return {
    id: "file-1",
    companyId: "company-1",
    provider: "local_disk" as const,
    objectKey: "assets/general/file-1",
    contentType: "image/png",
    byteSize: 1024,
    sha256: "deadbeef",
    originalFilename: "photo.png",
    createdByAgentId: null,
    createdByUserId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function createStorageService(): StorageService {
  return {
    provider: "local_disk" as const,
    putFile: vi.fn(),
    getObject: vi.fn(),
    headObject: vi.fn(),
    deleteObject: vi.fn().mockResolvedValue(undefined),
  };
}

async function createApp(storage: StorageService) {
  const { assetRoutes } = await vi.importActual<typeof import("../routes/assets.js")>("../routes/assets.js");
  const app = express();
  app.use((req, _res, next) => {
    req.actor = { type: "board", source: "local_implicit", userId: "user-1" };
    next();
  });
  app.use("/api", assetRoutes({} as any, storage));
  return app;
}

// ---------------------------------------------------------------------------
// GET /api/files
// ---------------------------------------------------------------------------

describe("GET /api/files", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("../services/activity-log.js");
    vi.doUnmock("../services/assets.js");
    vi.doUnmock("../services/index.js");
    vi.doUnmock("../routes/assets.js");
    vi.doUnmock("../routes/authz.js");
    vi.doUnmock("../middleware/index.js");
    registerModuleMocks();
    vi.resetAllMocks();
    listByCompanyMock.mockReset();
  });

  it("returns 400 when companyId is missing", async () => {
    const app = await createApp(createStorageService());
    const res = await request(app).get("/api/files");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/companyId/);
  });

  it("returns paginated file list for a company", async () => {
    const app = await createApp(createStorageService());
    listByCompanyMock.mockResolvedValue({
      files: [makeAsset()],
      total: 1,
      page: 1,
      perPage: 50,
    });

    const res = await request(app).get("/api/files?companyId=company-1");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0]).toMatchObject({
      id: "file-1",
      originalFilename: "photo.png",
      contentType: "image/png",
      byteSize: 1024,
      contentPath: "/api/assets/file-1/content",
    });
    expect(listByCompanyMock).toHaveBeenCalledWith("company-1", {
      q: undefined,
      page: 1,
      perPage: 50,
    });
  });

  it("passes search query to the service", async () => {
    const app = await createApp(createStorageService());
    listByCompanyMock.mockResolvedValue({ files: [], total: 0, page: 1, perPage: 50 });

    const res = await request(app).get("/api/files?companyId=company-1&q=photo");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(listByCompanyMock).toHaveBeenCalledWith("company-1", {
      q: "photo",
      page: 1,
      perPage: 50,
    });
  });

  it("ignores blank search query (treats as no filter)", async () => {
    const app = await createApp(createStorageService());
    listByCompanyMock.mockResolvedValue({ files: [], total: 0, page: 1, perPage: 50 });

    await request(app).get("/api/files?companyId=company-1&q=   ");
    expect(listByCompanyMock).toHaveBeenCalledWith("company-1", {
      q: undefined,
      page: 1,
      perPage: 50,
    });
  });

  it("passes pagination params to the service", async () => {
    const app = await createApp(createStorageService());
    listByCompanyMock.mockResolvedValue({ files: [], total: 0, page: 2, perPage: 10 });

    await request(app).get("/api/files?companyId=company-1&page=2&per_page=10");
    expect(listByCompanyMock).toHaveBeenCalledWith("company-1", {
      q: undefined,
      page: 2,
      perPage: 10,
    });
  });

  it("returns empty list shape when company has no files", async () => {
    const app = await createApp(createStorageService());
    listByCompanyMock.mockResolvedValue({ files: [], total: 0, page: 1, perPage: 50 });

    const res = await request(app).get("/api/files?companyId=company-1");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ files: [], total: 0, page: 1, perPage: 50 });
  });

  it("includes contentPath derived from asset id in each file record", async () => {
    const app = await createApp(createStorageService());
    const assets = [
      makeAsset({ id: "file-a" }),
      makeAsset({ id: "file-b", originalFilename: "doc.pdf", contentType: "application/pdf" }),
    ];
    listByCompanyMock.mockResolvedValue({ files: assets, total: 2, page: 1, perPage: 50 });

    const res = await request(app).get("/api/files?companyId=company-1");
    expect(res.status).toBe(200);
    expect(res.body.files[0].contentPath).toBe("/api/assets/file-a/content");
    expect(res.body.files[1].contentPath).toBe("/api/assets/file-b/content");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/files/:fileId
// ---------------------------------------------------------------------------

describe("DELETE /api/files/:fileId", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock("../services/activity-log.js");
    vi.doUnmock("../services/assets.js");
    vi.doUnmock("../services/index.js");
    vi.doUnmock("../routes/assets.js");
    vi.doUnmock("../routes/authz.js");
    vi.doUnmock("../middleware/index.js");
    registerModuleMocks();
    vi.resetAllMocks();
    getByIdMock.mockReset();
    deleteByIdMock.mockReset();
    logActivityMock.mockReset();
  });

  it("returns 404 when file does not exist", async () => {
    const app = await createApp(createStorageService());
    getByIdMock.mockResolvedValue(null);

    const res = await request(app).delete("/api/files/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("deletes the file and returns the deleted id", async () => {
    const storage = createStorageService();
    const app = await createApp(storage);
    const asset = makeAsset();
    getByIdMock.mockResolvedValue(asset);
    deleteByIdMock.mockResolvedValue(asset);

    const res = await request(app).delete("/api/files/file-1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: "file-1" });
    expect(deleteByIdMock).toHaveBeenCalledWith("file-1", "company-1");
    expect(storage.deleteObject).toHaveBeenCalledWith("company-1", asset.objectKey);
  });

  it("returns 404 when deleteById finds no row (race condition)", async () => {
    const app = await createApp(createStorageService());
    const asset = makeAsset();
    getByIdMock.mockResolvedValue(asset);
    deleteByIdMock.mockResolvedValue(null);

    const res = await request(app).delete("/api/files/file-1");
    expect(res.status).toBe(404);
  });

  it("logs an activity record after successful deletion", async () => {
    const app = await createApp(createStorageService());
    const asset = makeAsset();
    getByIdMock.mockResolvedValue(asset);
    deleteByIdMock.mockResolvedValue(asset);

    await request(app).delete("/api/files/file-1");
    expect(logActivityMock).toHaveBeenCalledOnce();
    expect(logActivityMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: "asset.deleted",
        entityType: "asset",
        entityId: "file-1",
      }),
    );
  });

  it("still returns 200 when storage delete fails (orphaned object is acceptable)", async () => {
    const storage = createStorageService();
    (storage.deleteObject as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("storage unavailable"));
    const app = await createApp(storage);
    const asset = makeAsset();
    getByIdMock.mockResolvedValue(asset);
    deleteByIdMock.mockResolvedValue(asset);

    const res = await request(app).delete("/api/files/file-1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: "file-1" });
  });
});
