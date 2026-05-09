import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Image,
  File,
  Trash2,
  Search,
  X,
  FolderOpen,
} from "lucide-react";
import { assetsApi, type AssetFile } from "../api/assets";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) return <Image className="h-5 w-5 text-blue-500 shrink-0" />;
  if (contentType === "application/pdf" || contentType.includes("text")) return <FileText className="h-5 w-5 text-orange-500 shrink-0" />;
  return <File className="h-5 w-5 text-muted-foreground shrink-0" />;
}

function FileCard({
  file,
  onDelete,
}: {
  file: AssetFile;
  onDelete: (file: AssetFile) => void;
}) {
  const name = file.originalFilename ?? "Unnamed file";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-card hover:bg-accent/30 transition-colors group">
      <FileTypeIcon contentType={file.contentType} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={name}>{name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.byteSize)} · {formatDate(file.createdAt)}
        </p>
      </div>
      <a
        href={`/api${file.contentPath}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground shrink-0 hidden group-hover:inline"
        onClick={(e) => e.stopPropagation()}
      >
        View
      </a>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(file)}
        title="Delete file"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FileLibrarySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[60px] w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyFileState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">
        {hasQuery ? "No files match your search" : "No files uploaded yet"}
      </p>
      {!hasQuery && (
        <p className="text-xs text-muted-foreground/70">
          Files you upload will appear here.
        </p>
      )}
    </div>
  );
}

function DeleteFileDialog({
  file,
  onClose,
  onConfirm,
  isPending,
}: {
  file: AssetFile | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={!!file} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete file?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {file?.originalFilename ?? "This file"}
          </span>{" "}
          will be permanently deleted. This cannot be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Assets() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AssetFile | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    setBreadcrumbs([{ label: "Files" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.assets.list(selectedCompanyId!, debouncedQuery || undefined),
    queryFn: () => assetsApi.list(selectedCompanyId!, { q: debouncedQuery || undefined }),
    enabled: !!selectedCompanyId,
  });

  const deleteMutation = useMutation({
    mutationFn: (assetId: string) => assetsApi.deleteFile(assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets", selectedCompanyId!] });
      setPendingDelete(null);
    },
  });

  const files = data?.files ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-base font-semibold">Files</h1>
        {data && (
          <span className="text-sm text-muted-foreground">{data.total} file{data.total !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Search bar */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by filename…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <FileLibrarySkeleton />
        ) : files.length === 0 ? (
          <EmptyFileState hasQuery={!!debouncedQuery} />
        ) : (
          <div className="flex flex-col gap-2 max-w-2xl">
            {files.map((file) => (
              <FileCard key={file.id} file={file} onDelete={setPendingDelete} />
            ))}
          </div>
        )}
      </div>

      <DeleteFileDialog
        file={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
