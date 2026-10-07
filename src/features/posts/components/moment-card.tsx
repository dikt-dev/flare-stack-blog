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
  isLast?: boolean;
}

export function MomentCard({ post, isLast }: MomentCardProps) {
  const tagNames = (post.tags ?? []).map((t) => t.name);
  const hasCover = Boolean(post.cover);

  return (
    <div className="w-full">
      <div className="fuwari-card-base flex flex-col w-full rounded-(--fuwari-radius-large) overflow-hidden">
        {/* 封面：有封面时显示 */}
        {hasCover && post.cover ? (
          <div className="p-4 pb-0">
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              aria-label={post.title}
              className="group relative block w-full aspect-[16/9] overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 z-10 group-hover:bg-black/20 transition pointer-events-none" />
              <img
                src={getPublicImageSrc(post.cover.url, PUBLIC_IMAGE_WIDTH.cover)}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
            </Link>
          </div>
        ) : null}

        {/* 内容区：没封面时加大间距，让文字占更多面积 */}
        <div
          className={
            hasCover
              ? "flex flex-col gap-2.5 p-5"
              : "flex flex-col gap-3 p-6 py-8"
          }
        >
          {/* 标题 */}
          <Link
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="group flex items-start gap-2"
          >
            <span
              className={
                hasCover
                  ? "text-lg font-bold fuwari-text-90 leading-snug group-hover:text-(--fuwari-primary) transition"
                  : "text-xl font-bold fuwari-text-90 leading-snug group-hover:text-(--fuwari-primary) transition"
              }
            >
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
                      <span className="mx-1 text-(--fuwari-meta-divider)">
                        /
                      </span>
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
          <p
            className={
              hasCover
                ? "fuwari-text-75 text-sm leading-relaxed line-clamp-3"
                : "fuwari-text-75 text-sm leading-relaxed line-clamp-6"
            }
          >
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

      {/* 卡片之间的虚线分割（最后一项不显示） */}
      {!isLast && (
        <div className="my-3 border-t border-dashed border-(--fuwari-meta-divider)" />
      )}
    </div>
  );
}