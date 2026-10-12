export function getContentTypeFromKey(key: string): string | undefined {
  const extension = key.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    avif: "image/avif",
  };
  return contentTypes[extension || ""];
}

export function generateKey(fileName: string): string {
  const uuid = crypto.randomUUID();
  const extension = fileName.split(".").pop()?.toLowerCase() || "bin";

  return `${uuid}.${extension}`;
}

/**
 * 从图片 URL 中提取 R2 key
 * 支持格式：
 * - /images/${key}
 * - https://img.ryn.us.ci/images/${key}
 * - /asset/${key}
 * - https://img.ryn.us.ci/asset/${key}
 */
export function extractImageKey(src: string): string | undefined {
  if (!src) return undefined;

  const prefixes = [
    "/images/",
    "https://img.ryn.us.ci/images/",
    "/asset/",
    "https://img.ryn.us.ci/asset/",
  ];
  let pathname = "";

  try {
    const url = new URL(src, "http://dummy.com");
    pathname = url.pathname;
  } catch {
    pathname = src.split("?")[0];
  }

  for (const prefix of prefixes) {
    const matchPath = prefix.startsWith("http")
      ? new URL(prefix).pathname
      : prefix;
    if (pathname.startsWith(matchPath)) {
      const rest = pathname.replace(matchPath, "");
      return prefix.includes("asset") ? `asset/${rest}` : rest;
    }
  }
  return undefined;
}

export function isGifKey(key: string, contentType?: string | null) {
  return key.toLowerCase().endsWith(".gif") || contentType === "image/gif";
}

export const PUBLIC_IMAGE_WIDTH = {
  banner: 1600,
  cover: 800,
  body: 800,
  avatar: 400,
  // The lightbox; Cloudflare never upscales, so smaller originals keep their size.
  zoom: 2560,
} as const;

export function getOriginalImageUrl(key: string) {
  if (key.startsWith("asset/")) {
    return `https://img.ryn.us.ci/${key}`;
  }
  return `https://img.ryn.us.ci/images/${key}`;
}

export function getOptimizedImageUrl(key: string, width?: number) {
  if (key.startsWith("asset/")) {
    return `https://img.ryn.us.ci/${key}`;
  }
  return `https://img.ryn.us.ci/images/${key}`;
}

/** A `srcset` of transformed widths, or undefined when the image is not transformed. */
export function getPublicImageSrcSet(
  src: string,
  widths: ReadonlyArray<number>,
) {
  const key = extractImageKey(src);
  if (!key || isGifKey(key)) return undefined;
  return widths
    .map((width) => `${getPublicImageSrc(src, width)} ${width}w`)
    .join(", ");
}

export function getPublicImageSrc(src: string, width: number) {
  const key = extractImageKey(src);
  if (!key) return src;
  const version = new URL(src, "http://dummy.com").searchParams.get("v");
  const optimized = getOptimizedImageUrl(key, width);
  if (!version) return optimized;
  return `${optimized}?v=${version}`;
}

// Cloudflare bills each image and parameter set once a month, so only the
// widths the site requests are transformed. Anything else gets the original,
// which keeps arbitrary parameters from using up the transformation quota.
export const IMAGE_TRANSFORM_WIDTHS = [400, 800, 1600, 2560] as const;
const IMAGE_TRANSFORM_QUALITY = 80;
const IMAGE_TRANSFORM_PARAMS = new Set(["width", "quality", "v"]);

/**
 * The Cloudflare transform for a public image request, or null to serve the
 * original. Only an allowed width at the site's quality is transformed.
 */
export function parseImageTransform(
  searchParams: URLSearchParams,
  accept: string,
) {
  for (const name of searchParams.keys()) {
    if (!IMAGE_TRANSFORM_PARAMS.has(name)) return null;
  }
  const width = Number(searchParams.get("width"));
  if (!IMAGE_TRANSFORM_WIDTHS.some((allowed) => allowed === width)) return null;
  const quality = searchParams.get("quality");
  if (quality !== null && Number(quality) !== IMAGE_TRANSFORM_QUALITY) {
    return null;
  }

  const format: "avif" | "webp" | undefined = /image\/avif/.test(accept)
    ? "avif"
    : /image\/webp/.test(accept)
      ? "webp"
      : undefined;
  return {
    width,
    quality: IMAGE_TRANSFORM_QUALITY,
    ...(format ? { format } : {}),
  };
}

/** 获取用于 Cloudflare Image Resizing 的源图 URL */
export function getTransformSourceUrl(url: URL, key: string): string {
  return `${url.origin}/images/${key}?original=true`;
}
