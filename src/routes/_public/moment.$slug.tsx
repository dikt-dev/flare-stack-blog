import { createFileRoute } from "@tanstack/react-router";
import { PostPage } from "@/features/posts/components/post-page";
import { postBySlugQuery } from "@/features/posts/queries";

export const Route = createFileRoute("/_public/moment/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(
      postBySlugQuery(params.slug),
    );
    if (!post) throw new Error("Post not found");
    return { post };
  },
  component: PostPage,
});