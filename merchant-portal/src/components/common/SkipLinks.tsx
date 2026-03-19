/**
 * SkipLinks — Hidden skip navigation links for keyboard users (WCAG 2.1).
 *
 * Links are visually hidden until focused via Tab key.
 * On focus, they appear as a prominent bar at the top of the viewport.
 * Targets must have matching `id` attributes in the DOM.
 *
 * Usage: Place at the very top of the app shell layout.
 */

import type { CSSProperties } from "react";

interface SkipLink {
  /** Target element id (without #) */
  targetId: string;
  /** Visible label when focused */
  label: string;
}

interface SkipLinksProps {
  /** Override default skip links */
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { targetId: "main-content", label: "Skip to main content" },
  { targetId: "main-navigation", label: "Skip to navigation" },
  { targetId: "search-input", label: "Skip to search" },
];

/** Styles: visually hidden until focused, then prominent */
const linkStyle: CSSProperties = {
  position: "fixed",
  top: "-100px",
  left: 0,
  padding: "12px 24px",
  backgroundColor: "#f97316",
  color: "#0a0a0a",
  fontWeight: 700,
  fontSize: 14,
  fontFamily: "system-ui, sans-serif",
  textDecoration: "none",
  zIndex: 100000,
  borderRadius: "0 0 8px 0",
  transition: "top 0.15s ease",
  outline: "2px solid #fff",
  outlineOffset: 2,
};

const linkFocusStyle: CSSProperties = {
  top: 0,
};

export function SkipLinks({ links = DEFAULT_LINKS }: SkipLinksProps) {
  return (
    <nav aria-label="Skip navigation">
      {links.map((link) => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          style={linkStyle}
          onFocus={(e) => {
            Object.assign(e.currentTarget.style, linkFocusStyle);
          }}
          onBlur={(e) => {
            e.currentTarget.style.top = "-100px";
          }}
          onClick={(e) => {
            const target = document.getElementById(link.targetId);
            if (target) {
              e.preventDefault();
              target.setAttribute("tabindex", "-1");
              target.focus();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
