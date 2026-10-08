import type { PostItem } from "@/features/posts/schema/posts.schema";
import { ArchivePost } from "./archive-post";
import { ArchiveYear } from "./archive-year";

interface ArchivePanelProps {
  posts: Array<PostItem>;
}

export function ArchivePanel({ posts }: ArchivePanelProps) {
  const groupedPosts = posts.reduce(
    (acc, post) => {
      if (!post.publishedAt) {
        return acc;
      }

      const year = new Date(post.publishedAt).getUTCFullYear();
      acc[year] ??= [];
      acc[year].push(post);
      return acc;
    },
    {} as Record<number, Array<PostItem>>,
  );

  const years = Object.keys(groupedPosts)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="fuwari-card-base px-8 py-6">
      {years.map((year) => (
        <div key={year} className="relative">
          {/* 整年的竖线：从年份下方，贯穿到当年最后一项 */}
          <div
            className="absolute left-[22.5%] md:left-[15%] top-0 bottom-0 w-px bg-black/10 dark:bg-white/10 pointer-events-none"
            aria-hidden="true"
          />
          <ArchiveYear year={year} count={groupedPosts[year].length} />
          {groupedPosts[year].map((post) => (
            <ArchivePost key={post.id} post={post} />
          ))}
        </div>
      ))}
    </div>
  );
}