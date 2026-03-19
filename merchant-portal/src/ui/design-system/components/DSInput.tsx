/**
 * DSInput — Design System Input
 *
 * Consistent text input with dark theme styling.
 *
 * Usage:
 *   <DSInput label="Name" value={name} onChange={e => setName(e.target.value)} />
 *   <DSInput type="number" placeholder="0.00" />
 */
import type { CSSProperties, InputHTMLAttributes } from "react";

interface DSInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const inputStyle: CSSProperties = {
  background: "#0a0a0a",
  border: "1px solid #262626",
  borderRadius: 8,
  padding: "8px 12px",
  color: "#fafafa",
  fontSize: 14,
  fontFamily: "Inter, system-ui, sans-serif",
  outline: "none",
  transition: "border-color 0.15s ease",
  width: "100%",
};

export function DSInput({ label, error, fullWidth = true, style, ...props }: DSInputProps) {
  return (
    <div style={{ width: fullWidth ? "100%" : undefined }}>
      {label && (
        <label style={{ color: "#a3a3a3", fontSize: 12, display: "block", marginBottom: 4, fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        style={{
          ...inputStyle,
          borderColor: error ? "#ef4444" : "#262626",
          width: fullWidth ? "100%" : undefined,
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? "#ef4444" : "#f59e0b";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#ef4444" : "#262626";
        }}
        {...props}
      />
      {error && (
        <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{error}</span>
      )}
    </div>
  );
}
