import { Link } from "@tanstack/react-router";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import { formatPublicPostDate } from "@/features/posts/utils/format-public-post-date";
import { m } from "@/paraglide/messages";

interface ArchivePostProps {
  post: PostItem;
}

export function ArchivePost({ post }: ArchivePostProps) {
  const date = post.publishedAt ? new Date(post.publishedAt) : null;

  return (
    <Link
      to="/post/$slug"
      params={{ slug: post.slug }}
      className="group block! w-full rounded-lg hover:bg-(--fuwari-btn-plain-bg-hover) active:bg-(--fuwari-btn-plain-bg-active) transition-colors"
      aria-label={post.title}
    >
      <div className="flex flex-row justify-start items-stretch h-full py-2">
        {/* 日期 */}
        <div className="w-[15%] md:w-[10%] shrink-0 text-sm text-right fuwari-text-50 pr-2 flex items-center justify-end">
          <time dateTime={date?.toISOString()}>
            {formatPublicPostDate(date, { monthDay: true })}
          </time>
        </div>

        {/* 时间线节点（只保留节点，竖线由父容器画） */}
        <div className="w-[15%] md:w-[10%] shrink-0 relative flex items-center">
          <div
            className="relative z-10 transition-all mx-auto w-1 h-1 rounded group-hover:h-5
              bg-black/50 dark:bg-white/50 group-hover:bg-(--fuwari-primary)
              outline z-50
              outline-(--fuwari-card-bg)
              group-hover:outline-(--fuwari-btn-plain-bg-hover)
              group-active:outline-(--fuwari-btn-plain-bg-active)"
          />
        </div>

        {/* 封面缩略图 */}
        <div className="w-16 h-12 md:w-20 md:h-14 shrink-0 rounded-lg overflow-hidden ml-2 mr-3 self-center">
          {post.cover ? (
            <img
              src={getPublicImageSrc(post.cover.url, PUBLIC_IMAGE_WIDTH.cover)}
              alt={post.title}
              width={post.cover.width ?? undefined}
              height={post.cover.height ?? undefined}
              loading="lazy"
              className="w-full h-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-(--fuwari-btn-regular-bg)" />
          )}
        </div>

        {/* 标题 + 摘要 */}
        <div className="flex-1 min-w-0 pr-4 self-center">
          <div className="text-left font-bold fuwari-text-75 group-hover:text-(--fuwari-primary) transition-colors line-clamp-1">
            {post.title}
          </div>
          <div className="mt-0.5 text-sm fuwari-text-50 line-clamp-1">
            {post.summary ?? m.post_card_no_summary()}
          </div>
        </div>

        {/* 标签（大屏） */}
        <div className="hidden md:flex md:w-[15%] shrink-0 items-center text-left text-sm whitespace-nowrap overflow-hidden text-ellipsis fuwari-text-30">
          {post.tags?.map((t) => `#${t.name}`).join(" ")}
        </div>
      </div>
    </Link>
  );
}