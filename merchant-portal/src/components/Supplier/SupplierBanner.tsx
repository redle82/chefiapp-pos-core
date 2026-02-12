import React from "react";
import type { Placement } from "../../types/supplier";

interface SupplierBannerProps {
  placement?: Placement;
}

export const SupplierBanner: React.FC<SupplierBannerProps> = ({
  placement,
}) => {
  if (
    !placement ||
    !placement.campaign ||
    !placement.campaign.assets.banner_mobile
  ) {
    return null;
  }

  const { campaign } = placement;

  return (
    <div
      style={{
        width: "100%",
        marginBottom: "1rem",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        position: "relative",
        backgroundColor: "#f5f5f5", // placeholder
      }}
    >
      {/*
        Ideally this would be an <img> but we might just use text if no image is available yet.
        For now we assume banner_mobile has a URL.
        If it's just a color/text placeholder for dev:
      */}
      {campaign.assets.banner_mobile!.startsWith("http") ? (
        <img
          src={campaign.assets.banner_mobile!}
          alt={campaign.name}
          style={{
            width: "100%",
            display: "block",
            objectFit: "cover",
            maxHeight: "120px",
          }}
        />
      ) : (
        <div
          style={{
            padding: "1rem",
            textAlign: "center",
            backgroundColor: "#333",
            color: "#fff",
          }}
        >
          <small
            style={{
              opacity: 0.7,
              textTransform: "uppercase",
              fontSize: "10px",
            }}
          >
            Parceiro Oficial
          </small>
          <h3 style={{ margin: "4px 0 0" }}>{campaign.name}</h3>
        </div>
      )}

      {/* Optional Tracking Pixel or similar would go here */}
    </div>
  );
};
