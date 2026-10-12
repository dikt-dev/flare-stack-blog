import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import ZoomableImage from "./zoomable-image";

export function ImageDisplay({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    // 1. 删除了 overflow-hidden rounded-xl，避免背景色被剪裁成圆角
    // 2. 添加了 bg-transparent 强制背景透明，去除蓝色框
    // 3. 添加了 flex flex-col items-center justify-center 让内部图片和文字整体居中
    <figure className="not-prose my-8 group relative flex flex-col items-center justify-center bg-transparent w-full fuwari-onload-animation select-none">
      
      {/* Image Container */}
      {/* 确保图片外层容器也是居中的 */}
      <div className="relative flex justify-center w-full">
        {/* Dark mode overlay - 保持原有逻辑 */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-transparent dark:bg-black/10 transition-colors duration-300 rounded-xl" />

        <ZoomableImage
          src={getPublicImageSrc(src, PUBLIC_IMAGE_WIDTH.body)}
          alt={alt}
          width={width}
          height={height}
          // 加上 mx-auto 保证图片本身在容器里居中
          className="w-full h-auto mx-auto transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] scale-100 group-hover:scale-[1.01]"
        />
      </div>

      {/* Caption Content */}
      {alt && (
        <figcaption className="mt-4 p-0 flex items-center justify-center gap-2 px-4 text-center">
          <span className="text-sm font-medium fuwari-text-50 transition-colors duration-500 group-hover:fuwari-text-75 select-none">
            {alt}
          </span>
        </figcaption>
      )}
    </figure>
  );
}
