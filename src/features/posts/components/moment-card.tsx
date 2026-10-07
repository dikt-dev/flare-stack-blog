import { Link } from "@tanstack/react-router";
import { Calendar, ChevronRight, Clock, Eye, Tag } from "lucide-react";
import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatPublicPostDate } from "@/features/posts/utils/format-public-post-date";
import { withTagFilter } from "@/features/posts/utils/post-public-search";
import { m } from "@/paraglide/messages";

interface MomentCardProps {
  post: PostItem;
}

export function MomentCard({ post }: MomentCardProps) {
  const tagNames = (post.tags ?? []).map((t) => t.name);
  const hasCover = Boolean(post.cover);

  return (
    <div className="fuwari-card-base flex flex-col w-full rounded-(--fuwari-radius-large) overflow-hidden">
      {hasCover && post.cover ? (
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          aria-label={post.title}
          className="group relative w-full aspect-[16/9] overflow-hidden"
        >
          <div className="absolute pointer-events-none z-10 w-full h-full group-hover:bg-black/20 transition" />
          <img
            src={getPublicImageSrc(post.cover.url, PUBLIC_IMAGE_WIDTH.cover)}
            alt={post.title}
            width={post.cover.width ?? undefined}
            height={post.cover.height ?? undefined}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </Link>
      ) : null}

      <div className="px-5 pt-4 pb-4 w-full">
        {/* 标题 */}
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          className="group flex items-start gap-2 mb-2.5"
        >
          <span className="text-lg font-bold fuwari-text-90 leading-snug group-hover:text-(--fuwari-primary) transition">
            {post.title}
          </span>
          <ChevronRight
            size={18}
            className="mt-0.5 shrink-0 text-(--fuwari-primary) transition group-hover:translate-x-0.5"
          />
        </Link>

        {/* 日期 · 分类 · 标签 */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-xs fuwari-text-50">
          <span className="inline-flex items-center gap-1">
            <Calendar size={13} />
            {formatPublicPostDate(post.publishedAt)}
          </span>
          {post.category ? (
            <Link
              to="/moments"
              search={withTagFilter(post.category.name)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:text-(--fuwari-primary) hover:bg-(--fuwari-btn-plain-bg-hover) transition"
            >
              <Tag size={13} />
              {post.category.name}
            </Link>
          ) : null}
          {tagNames.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="text-(--fuwari-meta-divider)">·</span>
              {tagNames.slice(0, 3).map((name, i) => (
                <span key={name} className="inline-flex items-center">
                  {i > 0 && (
                    <span className="mx-1 text-(--fuwari-meta-divider)">/</span>
                  )}
                  <Link
                    to="/moments"
                    search={withTagFilter(name)}
                    className="hover:text-(--fuwari-primary) transition"
                  >
                    {name}
                  </Link>
                </span>
              ))}
              {tagNames.length > 3 && (
                <span className="text-(--fuwari-fg-30)">
                  +{tagNames.length - 3}
                </span>
              )}
            </span>
          )}
        </div>

        {/* 摘要 */}
        <p className="fuwari-text-75 text-sm leading-relaxed mb-3 line-clamp-3">
          {post.summary ?? m.post_card_no_summary()}
        </p>

        {/* 阅读时间 · 浏览量 */}
        <div className="flex items-center gap-3 text-xs fuwari-text-50">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} />
            {m.read_time({ count: post.readTimeInMinutes })}
          </span>
          {post.viewCount !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Eye size={12} />
              {m.post_views_count({ count: post.viewCount })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}