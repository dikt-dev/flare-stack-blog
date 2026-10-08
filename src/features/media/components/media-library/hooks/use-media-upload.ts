import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/features/media/media.schema";
import { orpc, orpcClient } from "@/lib/orpc";
import { m } from "@/paraglide/messages";

/** 前端压缩：把大图缩到合理尺寸，减少上传体积 */
async function compressImage(file: File): Promise<File> {
  // GIF 不压缩（保留动图）
  if (file.type === "image/gif") return file;

  // 小于 200KB 的图不压缩
  if (file.size < 200 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const MAX_WIDTH = 1920;   // ← 从 2560 改成 1920
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
      canvas.toBlob(resolve, "image/webp", 0.70),   // ← 从 0.85 改成 0.70
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    // 压缩失败就用原图
    return file;
  }
}

export function useMediaUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => orpcClient.media.upload({ image: file }),
  });

  const uploadFiles = async (files: Array<File>) => {
    const images = files.filter((file) =>
      ACCEPTED_IMAGE_TYPES.includes(file.type),
    );
    if (images.length === 0) {
      toast.error(m.media_validation_file_invalid_type());
      return;
    }

    setProgress({ current: 0, total: images.length });

    let completed = 0;
    let successCount = 0;

    try {
      // 并发上传，每张图独立处理
      await Promise.all(
        images.map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            toast.error(
              m.media_validation_file_too_large({ name: file.name }),
            );
            completed += 1;
            setProgress({ current: completed, total: images.length });
            return;
          }

          try {
            // 先在前端压缩
            const compressed = await compressImage(file);
            // 再上传
            await uploadMutation.mutateAsync(compressed);
            successCount += 1;
          } catch {
            toast.error(m.media_upload_fail({ name: file.name }));
          } finally {
            completed += 1;
            setProgress({ current: completed, total: images.length });
          }
        }),
      );

      if (successCount > 0) {
        toast.success(m.media_upload_success());
      }
      await queryClient.invalidateQueries({ queryKey: orpc.media.key() });
    } finally {
      setProgress(null);
    }
  };

  return {
    uploadFiles,
    progress,
    isUploading: progress != null,
  };
}