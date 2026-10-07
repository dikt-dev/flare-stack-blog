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
import { m } from "@/paraglide/messages";

/** 文章页只显示「文章」分类的内容 */
const POSTS_CATEGORY_NAME = "文章";

export const Route = createFileRoute("/_public/posts")({
  validateSearch: z.object({
    tagName: PostTagNameSchema,
  }),
  component: RouteComponent,
  pendingComponent: PostsSkeleton,
  loaderDeps: ({ search }) => ({
    tagName: search.tagName,
  }),
  loader: async ({ context, deps }) => {
    const [, , , domain, siteConfig] = await Promise.all([
      context.queryClient.prefetchInfiniteQuery(
        postsInfiniteQueryOptions({
          tagName: deps.tagName,
          categoryName: POSTS_CATEGORY_NAME,
          limit: POSTS_PER_PAGE,
        }),
      ),
      context.queryClient.prefetchQuery(tagsQueryOptions),
      context.queryClient.prefetchQuery(categoriesQueryOptions),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.posts_title(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/posts", {
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
    links: [canonicalLink(loaderData?.canonicalHref ?? "/posts")],
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
        categoryName: POSTS_CATEGORY_NAME,
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

function PostsSkeleton() {
  return <PostsPageSkeleton />;
}