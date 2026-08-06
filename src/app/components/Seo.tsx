import { useEffect } from "react";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from "../../lib/seo";

interface SeoProps {
  title: string;
  description: string;
  canonicalPath?: string | null;
  robots?: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "product";
  structuredData?: object | object[] | null;
}

const DEFAULT_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.content = content;
}

export function Seo({
  title,
  description,
  canonicalPath = "/",
  robots = DEFAULT_ROBOTS,
  image = DEFAULT_OG_IMAGE,
  imageAlt = "El Molino, dietética en Mar del Plata",
  type = "website",
  structuredData,
}: SeoProps) {
  const canonical = canonicalPath ? absoluteUrl(canonicalPath) : null;
  const socialImage = absoluteUrl(image);
  const structuredDataJson = structuredData
    ? JSON.stringify(structuredData).replace(/</g, "\\u003c")
    : null;

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = "es-AR";

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);
    upsertMeta("property", "og:locale", "es_AR");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    if (canonical) upsertMeta("property", "og:url", canonical);
    else document.head.querySelector('meta[property="og:url"]')?.remove();
    upsertMeta("property", "og:image", socialImage);
    upsertMeta("property", "og:image:alt", imageAlt);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", socialImage);

    let canonicalElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (canonical) {
      if (!canonicalElement) {
        canonicalElement = document.createElement("link");
        canonicalElement.rel = "canonical";
        document.head.appendChild(canonicalElement);
      }

      canonicalElement.href = canonical;
    } else {
      canonicalElement?.remove();
    }

    const existingJsonLd =
      document.head.querySelector<HTMLScriptElement>("#seo-json-ld");
    if (!structuredDataJson) {
      existingJsonLd?.remove();
      return;
    }

    const jsonLd = existingJsonLd ?? document.createElement("script");
    jsonLd.id = "seo-json-ld";
    jsonLd.type = "application/ld+json";
    jsonLd.text = structuredDataJson;
    if (!existingJsonLd) document.head.appendChild(jsonLd);
  }, [
    canonical,
    description,
    imageAlt,
    robots,
    socialImage,
    structuredDataJson,
    title,
    type,
  ]);

  return null;
}

export function NoIndexSeo({
  title,
  description,
}: Pick<SeoProps, "title" | "description">) {
  return (
    <Seo
      title={title}
      description={description}
      canonicalPath={null}
      robots="noindex, nofollow"
      structuredData={null}
    />
  );
}
