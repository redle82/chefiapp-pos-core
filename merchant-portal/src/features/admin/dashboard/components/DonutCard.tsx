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

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
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
                color: "#111827",
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
                  color: "#7c3aed",
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
                background:
                  "conic-gradient(#4c1d95 0deg, #4c1d95 0deg, #e5e7eb 0deg)",
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
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#4b5563",
                }}
              >
                {occupiedPercent}%
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#4b5563" }}>
              <div style={{ marginBottom: 4 }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#e5e7eb",
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
                    backgroundColor: "#4c1d95",
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
          backgroundColor: "#e5e7eb",
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
            backgroundColor: "#e5e7eb",
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
              backgroundColor: "#e5e7eb",
            }}
          />
          <div
            style={{
              width: "65%",
              height: 10,
              borderRadius: 999,
              backgroundColor: "#e5e7eb",
            }}
          />
        </div>
      </div>
    </div>
  );
}

