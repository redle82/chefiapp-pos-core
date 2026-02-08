/**
 * OperationalFullscreenWrapper — Layout fullscreen para /op/tpv e /op/kds
 *
 * Garante: min-height 100vh, overflow hidden, sem header/sidebar/footer.
 * Aplica meta viewport e apple-mobile-web-app quando montado (apenas para /op/*).
 * NÃO usa service workers nem PWA complexo.
 */

import { useEffect, type ReactNode } from "react";

const WRAPPER_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  height: "100vh",
  width: "100%",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  backgroundColor: "#0a0a0a",
};

export function OperationalFullscreenWrapper({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight = document.body.style.height;
    const prevBodyMinHeight = document.body.style.minHeight;

    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";
    document.body.style.minHeight = "100vh";

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const prevViewport = viewportMeta?.getAttribute("content") ?? null;
    if (viewportMeta) {
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, user-scalable=no",
      );
    }

    let appleCapable = document.querySelector(
      'meta[name="apple-mobile-web-app-capable"]',
    );
    if (!appleCapable) {
      appleCapable = document.createElement("meta");
      appleCapable.setAttribute("name", "apple-mobile-web-app-capable");
      document.head.appendChild(appleCapable);
    }
    const prevAppleCapable = appleCapable.getAttribute("content");
    appleCapable.setAttribute("content", "yes");

    let appleStatusBar = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]',
    );
    if (!appleStatusBar) {
      appleStatusBar = document.createElement("meta");
      appleStatusBar.setAttribute(
        "name",
        "apple-mobile-web-app-status-bar-style",
      );
      document.head.appendChild(appleStatusBar);
    }
    const prevAppleStatusBar = appleStatusBar.getAttribute("content");
    appleStatusBar.setAttribute("content", "black");

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
      document.body.style.minHeight = prevBodyMinHeight;
      if (viewportMeta && prevViewport)
        viewportMeta.setAttribute("content", prevViewport);
      if (appleCapable && prevAppleCapable)
        appleCapable.setAttribute("content", prevAppleCapable);
      if (appleStatusBar && prevAppleStatusBar)
        appleStatusBar.setAttribute("content", prevAppleStatusBar);
    };
  }, []);

  return <div style={WRAPPER_STYLE}>{children}</div>;
}
