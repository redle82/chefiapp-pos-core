/**
 * CountrySelector — Persistent language/country selector.
 */
import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDetectedCountry,
  setCountryOverride,
  type DetectedCountry,
} from "../countryDetection";
import { isValidCountryCode } from "../countries";

const LABELS: Record<DetectedCountry, string> = {
  es: "ES",
  pt: "PT",
  gb: "GB",
  us: "US",
  br: "BR",
};

export function CountrySelector() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pathCountry = pathname.replace(/^\//, "").split("/")[0] ?? "";
  const current = (pathCountry || getDetectedCountry()).toLowerCase();
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (code: DetectedCountry) => {
      if (!isValidCountryCode(code)) return;
      setCountryOverride(code);
      navigate(`/${code}`, { replace: true });
      setOpen(false);
    },
    [navigate]
  );

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.05)",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {LABELS[current as DetectedCountry] ?? "GB"} ▾
      </button>
      {open && (
        <>
          <div
            role="presentation"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
            }}
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 4,
              padding: 4,
              borderRadius: 8,
              background: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              minWidth: 80,
              zIndex: 50,
              listStyle: "none",
            }}
          >
            {(["es", "pt", "gb", "us", "br"] as DetectedCountry[]).map(
              (code) => (
                <li key={code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={current === code}
                    onClick={() => handleSelect(code)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      border: "none",
                      borderRadius: 4,
                      background: current === code ? "rgba(251,191,36,0.2)" : "transparent",
                      color: "white",
                      fontSize: "0.875rem",
                      cursor: "pointer",
                    }}
                  >
                    {LABELS[code]}
                  </button>
                </li>
              )
            )}
          </ul>
        </>
      )}
    </div>
  );
}
