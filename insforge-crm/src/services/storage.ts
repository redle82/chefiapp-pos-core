import { insforge } from '../config/insforge';

export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await insforge.storage
    .from(bucket)
    .upload(path, file);

  return { data, error };
}

export async function uploadFileAuto(bucket: string, file: File) {
  const { data, error } = await insforge.storage
    .from(bucket)
    .uploadAuto(file);

  return { data, error };
}

export async function downloadFile(bucket: string, path: string) {
  const { data, error } = await insforge.storage
    .from(bucket)
    .download(path);

  return { data, error };
}

export async function deleteFile(bucket: string, path: string) {
  const { data, error } = await insforge.storage
    .from(bucket)
    .remove(path);

  return { data, error };
}

export async function getFileUrl(bucket: string, path: string): Promise<string> {
  // InsForge returns the URL directly from upload
  // For downloads, construct the URL manually
  const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL || 'https://vv5bwyz6.us-east.insforge.app';
  const encodedPath = encodeURIComponent(path);
  return `${baseUrl}/api/storage/buckets/${bucket}/objects/${encodedPath}`;
}
