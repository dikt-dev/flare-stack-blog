import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "@/features/media/media.schema";
import { uploadImage } from "@/features/media/utils/upload-image";
import { orpc } from "@/lib/orpc";
import { m } from "@/paraglide/messages";

export function useMediaUpload() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadImage(file),
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
      await Promise.all(
        images.map(async (file) => {
          if (file.size > MAX_FILE_SIZE) {
            toast.error(m.media_validation_file_too_large());
            completed += 1;
            setProgress({ current: completed, total: images.length });
            return;
          }

          try {
            await uploadMutation.mutateAsync(file);
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