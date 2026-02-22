import { useState } from "react";
import { createAttachment } from "../services/database";
import { uploadFileAuto } from "../services/storage";

export default function FileUpload({ dealId }: { dealId: string }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  }

  async function handleUpload() {
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const { data, error } = await uploadFileAuto("deals", file);
        if (error) throw error;

        if (data) {
          await createAttachment({
            deal_id: dealId,
            file_url: data.url,
            file_key: data.key,
            file_name: file.name,
          });
        }
      }
      setFiles([]);
      alert("Files uploaded successfully");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded">
      <input
        type="file"
        multiple
        onChange={handleChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload Files"}
        </button>
      )}
    </div>
  );
}
