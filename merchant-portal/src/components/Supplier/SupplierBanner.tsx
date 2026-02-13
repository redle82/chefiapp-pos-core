import React from "react";
import type { Placement } from "../../types/supplier";
import styles from "./SupplierBanner.module.css";

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
    <div className={styles.container}>
      {/*
        Ideally this would be an <img> but we might just use text if no image is available yet.
        For now we assume banner_mobile has a URL.
        If it's just a color/text placeholder for dev:
      */}
      {campaign.assets.banner_mobile!.startsWith("http") ? (
        <img
          src={campaign.assets.banner_mobile!}
          alt={campaign.name}
          className={styles.bannerImage}
        />
      ) : (
        <div className={styles.placeholder}>
          <small className={styles.partnerLabel}>Parceiro Oficial</small>
          <h3 className={styles.campaignName}>{campaign.name}</h3>
        </div>
      )}

      {/* Optional Tracking Pixel or similar would go here */}
    </div>
  );
};
