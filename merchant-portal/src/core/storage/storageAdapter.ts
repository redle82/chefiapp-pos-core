/**
 * Storage adapter — substitui Supabase Storage em modo Docker (MinIO S3-compatible).
 *
 * Em modo Docker: MinIO (http://localhost:9000).
 * Em modo Supabase: Supabase Storage (ou usar este adapter com backend Supabase).
 *
 * Interface mínima: upload, getPublicUrl, remove.
 * Nenhum código usa Supabase Storage hoje; este adapter fica pronto para uso futuro.
 */

import { BackendType, getBackendType } from "../infra/backendAdapter";

const DEFAULT_MINIO_BASE = "http://localhost:9000";
const DEFAULT_MINIO_CONSOLE = "http://localhost:9001";
const DEFAULT_BUCKET = "chefiapp";

function getMinIOBase(): string {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_MINIO_URL) {
    return String(import.meta.env.VITE_MINIO_URL).replace(/\/$/, "");
  }
  return DEFAULT_MINIO_BASE;
}

export interface StorageUploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload de ficheiro para o storage activo (MinIO em Docker, Supabase em cloud).
 * Em Docker: PUT para MinIO (S3 API); requer bucket criado e credenciais em env.
 *
 * Por agora devolve um placeholder; integrar com AWS SDK ou fetch S3 quando houver uso real.
 */
export async function storageUpload(
  bucket: string,
  path: string,
  file: File | Blob,
  _options?: { contentType?: string }
): Promise<StorageUploadResult> {
  if (getBackendType() === BackendType.docker) {
    const base = getMinIOBase();
    // TODO: usar AWS SDK S3 client ou fetch com assinatura AWS4 quando houver uso
    // Por agora falhar com mensagem clara para quem implementar o primeiro upload
    throw new Error(
      `[StorageAdapter] MinIO upload não implementado. Base: ${base}, bucket: ${bucket}, path: ${path}. Use S3-compatible client com VITE_MINIO_URL.`
    );
  }
  // Supabase: supabase.storage.from(bucket).upload(path, file)
  throw new Error(
    "[StorageAdapter] Supabase Storage não usado neste projeto; use storageAdapter apenas em modo Docker com MinIO."
  );
}

/**
 * URL pública para um objecto no storage.
 * MinIO: http://localhost:9000/bucket/path (ou signed URL se bucket privado).
 */
export function storageGetPublicUrl(bucket: string, path: string): string {
  if (getBackendType() === BackendType.docker) {
    const base = getMinIOBase();
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${base}/${bucket}/${cleanPath}`;
  }
  return "";
}

/**
 * Remove um objecto do storage.
 */
export async function storageRemove(bucket: string, path: string): Promise<void> {
  if (getBackendType() === BackendType.docker) {
    // TODO: DELETE para MinIO S3 API
    throw new Error(
      `[StorageAdapter] MinIO remove não implementado. Bucket: ${bucket}, path: ${path}.`
    );
  }
}

export function getStorageConfig(): {
  baseUrl: string;
  consoleUrl: string;
  defaultBucket: string;
} {
  const base = getMinIOBase();
  const consoleUrl =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_MINIO_CONSOLE_URL) ||
    DEFAULT_MINIO_CONSOLE;
  return {
    baseUrl: base,
    consoleUrl: String(consoleUrl),
    defaultBucket: DEFAULT_BUCKET,
  };
}
