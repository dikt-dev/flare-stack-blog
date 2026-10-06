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
 * - /images/${key}（媒体库图片）
 * - https://img.ryn.us.ci/images/${key}
 * - /asset/${key}（头像、背景图等站点资源）
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
      // asset/ 路径保留前缀，因为存储时就是 asset/xxx
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
} as const;

export function getOriginalImageUrl(key: string) {
  // asset/ 开头的走 /asset/ 路径，其他走 /images/
  if (key.startsWith("asset/")) {
    return `https://img.ryn.us.ci/${key}`;
  }
  return `https://img.ryn.us.ci/images/${key}`;
}

export function hasImageTransformParams(searchParams: URLSearchParams) {
  return (
    searchParams.has("width") ||
    searchParams.has("height") ||
    searchParams.has("quality") ||
    searchParams.has("fit")
  );
}

export function getOptimizedImageUrl(key: string, width?: number) {
  // 图片压缩已在 putToR2 中完成，直接返回 CDN 地址
  if (key.startsWith("asset/")) {
    return `https://img.ryn.us.ci/${key}`;
  }
  return `https://img.ryn.us.ci/images/${key}`;
}

export function getPublicImageSrc(src: string, width: number) {
  const key = extractImageKey(src);
  if (!key) return src;
  const version = new URL(src, "http://dummy.com").searchParams.get("v");
  const optimized = getOptimizedImageUrl(key, width);
  if (!version) return optimized;
  // 加上版本号避免缓存问题
  return `${optimized}?v=${version}`;
}

export function buildTransformOptions(
  searchParams: URLSearchParams,
  accept: string,
) {
  const transformOptions: Record<string, unknown> = { quality: 80 };

  if (searchParams.has("width")) {
    const width = Number.parseInt(searchParams.get("width")!, 10);
    if (!Number.isNaN(width) && width > 0) transformOptions.width = width;
  }
  if (searchParams.has("height")) {
    const height = Number.parseInt(searchParams.get("height")!, 10);
    if (!Number.isNaN(height) && height > 0) transformOptions.height = height;
  }
  if (searchParams.has("quality")) {
    const quality = Number.parseInt(searchParams.get("quality")!, 10);
    if (!Number.isNaN(quality) && quality > 0 && quality <= 100)
      transformOptions.quality = quality;
  }
  if (searchParams.has("fit")) transformOptions.fit = searchParams.get("fit");

  if (/image\/avif/.test(accept)) {
    transformOptions.format = "avif";
  } else if (/image\/webp/.test(accept)) {
    transformOptions.format = "webp";
  }

  return transformOptions;
}