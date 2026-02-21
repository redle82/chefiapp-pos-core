// @ts-nocheck
import { useCallback, useRef, useState } from "react";

interface ProductImageDropzoneProps {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
}

export function ProductImageDropzone({
  disabled,
  onFileSelected,
}: ProductImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const items = event.clipboardData?.items || [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          onFileSelected(file);
          event.preventDefault();
          return;
        }
      }
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.click()}
      tabIndex={0}
      role="button"
      aria-disabled={disabled}
      style={{
        border: `1px dashed ${dragActive ? "#22c55e" : "var(--mb-border)"}`,
        borderRadius: 12,
        padding: 16,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor: "var(--mb-surface)",
        color: "var(--mb-text-muted)",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(event) => handleFiles(event.target.files)}
        disabled={disabled}
        style={{ display: "none" }}
      />
      <div style={{ fontWeight: 600, color: "var(--mb-text)" }}>
        Arraste a imagem aqui
      </div>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        ou clique para escolher, ou cole com Ctrl+V / Cmd+V
      </div>
    </div>
  );
}
