export function isAdminWorkspace(pathname: string) {
  return (
    /^\/admin(?:\/|$)/.test(pathname) &&
    !pathname.startsWith("/admin/posts/edit/") &&
    !pathname.startsWith("/admin/moments/edit/")   // ← 新增
  );
}

// Keep this breakpoint aligned with content-workspace.css.
export const LOW_WORKSPACE_HEIGHT = "(max-height: 540px)";