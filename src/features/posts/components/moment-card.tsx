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
      {/* 封面：铺满卡片宽度，object-cover 裁切成 16:9 */}
      {hasCover && post.cover ? (
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          aria-label={post.title}
          className="group relative block w-full aspect-video overflow-hidden"
        >
          <div className="absolute inset-0 z-10 group-hover:bg-black/20 transition pointer-events-none" />
          <img
            src={getPublicImageSrc(post.cover.url, PUBLIC_IMAGE_WIDTH.cover)}
            alt={post.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </Link>
      ) : null}

      {/* 内容区 */}
      <div className="flex flex-col gap-2.5 p-5">
        {/* 标题 */}
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          className="group flex items-start gap-2"
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs fuwari-text-50">
          <span className="inline-flex items-center gap-1">
            <Calendar size={13} />
            {formatPublicPostDate(post.publishedAt)}
          </span>
          {post.category ? (
            <span className="inline-flex items-center gap-1">
              <Tag size={13} />
              {post.category.name}
            </span>
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
            </span>
          )}
        </div>

        {/* 摘要 */}
        <p className="fuwari-text-75 text-sm leading-relaxed line-clamp-3">
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