import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import {
  POSTS_PER_PAGE,
  PostsPage,
} from "@/features/posts/components/posts-page";
import { PostsPageSkeleton } from "@/features/posts/components/posts-page-skeleton";
import { categoriesQueryOptions } from "@/features/categories/queries";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import { PostTagNameSchema } from "@/features/posts/schema/posts.schema";
import { withTagFilter } from "@/features/posts/utils/post-public-search";
import { tagsQueryOptions } from "@/features/tags/queries";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";

// 动态页的分类 slug，要和后台创建的分类 slug 一致
const MOMENTS_CATEGORY_SLUG = "动态";

export const Route = createFileRoute("/_public/moments")({
  validateSearch: z.object({
    tagName: PostTagNameSchema,
  }),
  component: RouteComponent,
  pendingComponent: MomentsSkeleton,
  loaderDeps: ({ search }) => ({
    tagName: search.tagName,
  }),
  loader: async ({ context, deps }) => {
    const [, , , domain, siteConfig] = await Promise.all([
      context.queryClient.prefetchInfiniteQuery(
        postsInfiniteQueryOptions({
          tagName: deps.tagName,
          categoryName: MOMENTS_CATEGORY_SLUG,
          limit: POSTS_PER_PAGE,
        }),
      ),
      context.queryClient.prefetchQuery(tagsQueryOptions),
      context.queryClient.prefetchQuery(categoriesQueryOptions),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: "动态",
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/moments", {
        tagName: deps.tagName,
      }),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
      {
        name: "description",
        content: loaderData?.description,
      },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/moments")],
  }),
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: tags } = useSuspenseQuery(tagsQueryOptions);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      postsInfiniteQueryOptions({
        tagName: search.tagName,
        categoryName: MOMENTS_CATEGORY_SLUG,
        limit: POSTS_PER_PAGE,
      }),
    );

  const posts = useMemo(() => {
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  const handleTagClick = (clickedTag?: string) => {
    navigate({
      search: withTagFilter(clickedTag),
      replace: true,
    });
  };

  return (
    <PostsPage
      posts={posts}
      tags={tags}
      selectedTag={search.tagName}
      onTagClick={handleTagClick}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}

function MomentsSkeleton() {
  return <PostsPageSkeleton />;
}