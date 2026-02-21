interface DonutCardProps {
  loading: boolean;
  title: string;
  total: number;
  occupied: number;
  emptyLabel: string;
  occupiedLabel: string;
  detailsLabel?: string;
  onDetailsClick?: () => void;
}

export function DonutCard({
  loading,
  title,
  total,
  occupied,
  emptyLabel,
  occupiedLabel,
  detailsLabel,
  onDetailsClick,
}: DonutCardProps) {
  const empty = Math.max(total - occupied, 0);
  const occupiedPercent = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const emptyPercent = 100 - occupiedPercent;

  const occupiedDeg = (occupiedPercent / 100) * 360;
  return (
    <div
      style={{
        backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
        borderRadius: 12,
        border: "1px solid var(--surface-border)",
        padding: "18px 20px",
        minHeight: 168,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {loading ? (
        <SkeletonDonut />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: 0,
                color: "var(--heading-section, var(--text-primary))",
              }}
            >
              {title}
            </h2>
            {detailsLabel && (
              <button
                type="button"
                onClick={onDetailsClick}
                style={{
                  fontSize: 12,
                  color: "var(--color-primary, #7c3aed)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {detailsLabel}
              </button>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: `conic-gradient(var(--color-primary, #4c1d95) 0deg, var(--color-primary, #4c1d95) ${occupiedDeg}deg, var(--surface-border) ${occupiedDeg}deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: "var(--card-bg-on-dark, var(--surface-elevated))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                {occupiedPercent}%
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              <div style={{ marginBottom: 4 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--surface-border)",
                    marginRight: 6,
                  }}
                />
                {emptyLabel} {empty}/{total} ({emptyPercent}%)
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary, #4c1d95)",
                    marginRight: 6,
                  }}
                />
                {occupiedLabel} {occupied}/{total} ({occupiedPercent}%)
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SkeletonDonut() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 120,
          height: 14,
          borderRadius: 999,
          backgroundColor: "var(--surface-border)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            backgroundColor: "var(--surface-border)",
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              width: "80%",
              height: 10,
              borderRadius: 999,
              backgroundColor: "var(--surface-border)",
            }}
          />
          <div
            style={{
              width: "65%",
              height: 10,
              borderRadius: 999,
              backgroundColor: "var(--surface-border)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

