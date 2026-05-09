import type { AssetImage } from "@paperclipai/shared";
import { api } from "./client";

export type AssetFile = {
  id: string;
  originalFilename: string | null;
  contentType: string;
  byteSize: number;
  createdAt: string;
  contentPath: string;
};

export type AssetListResult = {
  files: AssetFile[];
  total: number;
  page: number;
  perPage: number;
};

export const assetsApi = {
  list: (companyId: string, opts?: { q?: string; page?: number; perPage?: number }) => {
    const params = new URLSearchParams();
    if (opts?.q) params.set("q", opts.q);
    if (opts?.page) params.set("page", String(opts.page));
    if (opts?.perPage) params.set("per_page", String(opts.perPage));
    const qs = params.toString();
    return api.get<AssetListResult>(`/companies/${companyId}/assets${qs ? `?${qs}` : ""}`);
  },

  deleteAsset: (companyId: string, assetId: string) =>
    api.delete<{ deleted: string }>(`/companies/${companyId}/assets/${assetId}`),

  uploadImage: async (companyId: string, file: File, namespace?: string) => {
    // Read file data into memory eagerly so the fetch body is self-contained.
    // Clipboard-paste File objects reference transient data that the browser may
    // discard after the paste-event handler returns, causing ERR_ACCESS_DENIED
    // when fetch() later tries to stream the FormData body.
    const buffer = await file.arrayBuffer();
    const safeFile = new File([buffer], file.name, { type: file.type });

    const form = new FormData();
    if (namespace && namespace.trim().length > 0) {
      form.append("namespace", namespace.trim());
    }
    form.append("file", safeFile);
    return api.postForm<AssetImage>(`/companies/${companyId}/assets/images`, form);
  },

  uploadCompanyLogo: async (companyId: string, file: File) => {
    const buffer = await file.arrayBuffer();
    const safeFile = new File([buffer], file.name, { type: file.type });

    const form = new FormData();
    form.append("file", safeFile);
    return api.postForm<AssetImage>(`/companies/${companyId}/logo`, form);
  },
};
