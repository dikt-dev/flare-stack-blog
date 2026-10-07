import { createFileRoute, Outlet } from "@tanstack/react-router";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/admin/moments")({
  component: RouteComponent,
  loader: () => ({
    title: "动态管理",
  }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function RouteComponent() {
  return <Outlet />;
}
