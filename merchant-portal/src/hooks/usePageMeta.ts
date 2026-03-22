import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  canonical?: string;
  keywords?: string;
}

/**
 * Sets page meta tags for SEO.
 * Cleans up on unmount by restoring default title.
 */
export function usePageMeta(meta: PageMeta): void {
  useEffect(() => {
    document.title = meta.title;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let tag = document.querySelector(
        `meta[${attr}="${name}"]`,
      ) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setMeta("description", meta.description);
    if (meta.keywords) setMeta("keywords", meta.keywords);
    setMeta("og:title", meta.ogTitle ?? meta.title, true);
    setMeta("og:description", meta.ogDescription ?? meta.description, true);
    setMeta("og:type", meta.ogType ?? "website", true);

    if (meta.canonical) {
      let link = document.querySelector(
        'link[rel="canonical"]',
      ) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = meta.canonical;
    }

    return () => {
      document.title = "ChefiApp\u2122 OS";
    };
  }, [
    meta.title,
    meta.description,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogType,
    meta.canonical,
    meta.keywords,
  ]);
}
