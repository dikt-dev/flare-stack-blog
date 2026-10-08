import { orpcClient } from "@/lib/orpc";

export interface UploadResult {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  fileName: string;
  key: string;
}

/** 压缩图片（内部用） */
async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size < 200 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_WIDTH = 1920;
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.65),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

/** 上传单张图片（自动压缩） */
export async function uploadImage(file: File): Promise<UploadResult> {
  const compressed = await compressImage(file);
  const result = await orpcClient.media.upload({ image: compressed });

  return {
    id: result.id,
    url: result.url,
    width: result.width ?? null,
    height: result.height ?? null,
    fileName: result.fileName,
    key: result.key,
  };
}