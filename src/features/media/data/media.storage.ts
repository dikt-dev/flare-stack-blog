import { generateKey } from "@/features/media/utils/media.utils";

export async function putToR2(
  env: Env,
  image: File,
  key = generateKey(image.name),
) {
  const contentType = image.type;
  const r2Key = `images/${key}`;

  let body: ReadableStream | File;
  let finalContentType = contentType;
  let finalSize = image.size;

  // GIF 动图跳过压缩，保持原格式
  if (contentType === "image/gif") {
    body = image;
  } else {
    // 非 GIF 图片转换为 WebP
    const response = (
      await env.IMAGES.input(image.stream())
        .output({ format: "image/webp", quality: 82 })
    ).response();

    body = response.body!;
    finalContentType = "image/webp";
    finalSize = parseInt(response.headers.get("content-length") || "0", 10);
  }

  await env.R2.put(r2Key, body, {
    httpMetadata: {
      contentType: finalContentType,
    },
    customMetadata: {
      originalName: image.name,
    },
  });

  return {
    key: r2Key,
    url: `https://img.ryn.us.ci/${r2Key}`, // 直连 R2 自定义域名
    fileName: image.name,
    mimeType: finalContentType,
    sizeInBytes: finalSize || image.size,
  };
}

export async function deleteFromR2(env: Env, key: string) {
  await env.R2.delete(key);
}

export async function getFromR2(env: Env, key: string) {
  return await env.R2.get(key);
}

/**
 * Upload a site asset (favicon, theme images) to R2 with a fixed key.
 * No DB record; overwrites in place on re-upload.
 */
export async function putSiteAsset(
  env: Env,
  file: File,
  assetPath: string,
): Promise<{ key: string; url: string }> {
  const key = `asset/${assetPath}`;
  await env.R2.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });
  return { key, url: `/images/${key}` };
}
