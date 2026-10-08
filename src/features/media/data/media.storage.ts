import { generateKey } from "@/features/media/utils/media.utils";

// 图片缓存策略：公开、1 年、内容不可变
const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function putToR2(
  env: Env,
  image: File,
  key = generateKey(image.name),
) {
  const contentType = image.type;
  let body: Blob | File;
  let finalContentType = contentType;
  let finalSize = image.size;
  let finalKey = key;

  // 前端已经压缩过的 WebP、GIF 动图，直接存
  if (contentType === "image/gif" || contentType === "image/webp") {
    body = image;
  } else {
    const response = (
      await env.IMAGES.input(image.stream())
        .output({ format: "image/webp", quality: 82 })
    ).response();

    const arrayBuffer = await response.arrayBuffer();
    finalSize = arrayBuffer.byteLength;
    body = new Blob([arrayBuffer], { type: "image/webp" });
    finalContentType = "image/webp";
    finalKey = key.replace(/\.[^.]+$/, ".webp");
  }

  const r2Key = `images/${finalKey}`;

  await env.R2.put(r2Key, body, {
    httpMetadata: {
      contentType: finalContentType,
      cacheControl: IMAGE_CACHE_CONTROL,
    },
    customMetadata: {
      originalName: image.name,
    },
  });

  return {
    key: finalKey,
    url: `https://img.ryn.us.ci/images/${finalKey}`,
    fileName: image.name,
    mimeType: finalContentType,
    sizeInBytes: finalSize,
  };
}

export async function deleteFromR2(env: Env, key: string) {
  await env.R2.delete(key);
}

export async function getFromR2(env: Env, key: string) {
  return await env.R2.get(key);
}

export async function putSiteAsset(
  env: Env,
  file: File,
  assetPath: string,
): Promise<{ key: string; url: string }> {
  const key = `asset/${assetPath}`;
  await env.R2.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      cacheControl: IMAGE_CACHE_CONTROL,
    },
  });

  const version = Date.now();
  return { key, url: `/asset/${assetPath}?v=${version}` };
}