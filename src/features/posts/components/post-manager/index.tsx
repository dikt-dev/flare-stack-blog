import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAdminChrome } from "@/components/admin/admin-chrome";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { orpc, orpcClient } from "@/lib/orpc";
import { ADMIN_ITEMS_PER_PAGE } from "@/lib/constants";
import { useContentMotion } from "@/hooks/use-motion";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { PostRow, PostsToolbar } from "./components";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useListScroll } from "./hooks/use-list-scroll";
import { useDeletePost, usePosts } from "./hooks";
import { PostManagerSkeleton } from "./post-manager-skeleton";
import type { AdminPostListItem, SortField, StatusFilter } from "./types";
import "./post-manager.css";

interface PostManagerLabels {
  title: string;
  create: string;
  creating: string;
}

interface PostManagerProps {
  page: number;
  status: StatusFilter;
  sortBy: SortField;
  search: string;
  onPageChange: (page: number) => void;
  onStatusChange: (status: StatusFilter) => void;
  onSortByChange: (sortBy: SortField) => void;
  onSearchChange: (search: string) => void;
  onResetFilters: () => void;
  fixedCategoryId?: number;
  labels?: PostManagerLabels;   // ← 只剩 title/create/creating
}

export function PostManager({
  page,
  status,
  sortBy,
  search,
  onPageChange,
  onStatusChange,
  onSortByChange,
  onSearchChange,
  onResetFilters,
  fixedCategoryId,
  labels,
}: PostManagerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setPrimaryAction } = useAdminChrome();
  const [postToDelete, setPostToDelete] = useState<AdminPostListItem | null>(
    null,
  );
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchCallbackRef = useRef(onSearchChange);
  searchCallbackRef.current = onSearchChange;
  const [searchInput, setSearchInput] = useState(search);
  const clearPendingSearch = useCallback(() => {
    if (searchTimerRef.current !== null) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = null;
  }, []);
  // URL changes (including browser Back) supersede any pending text submission.
  useEffect(() => {
    clearPendingSearch();
    setSearchInput(search);
  }, [search, clearPendingSearch]);
  useEffect(() => clearPendingSearch, [clearPendingSearch]);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearPendingSearch();
    searchTimerRef.current = setTimeout(() => {
      searchTimerRef.current = null;
      searchCallbackRef.current(value);
    }, 300);
  };
  const resetFilters = () => {
    clearPendingSearch();
    setSearchInput("");
    onResetFilters();
  };
  const {
    posts,
    totalCount,
    totalPages,
    statusCounts,
    isPending,
    isFetching,
    isPlaceholderData,
    error,
    refetch,
  } = usePosts({
    page,
    status,
    sortBy,
    search,
    categoryId: fixedCategoryId,
  });
  const contentRef = useRef<HTMLTableSectionElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useListScroll(
    scrollRef,
    { page, status, sortBy, search },
    !isPending && !isPlaceholderData && !error,
  );
  const motionKey = useRef("");
  if (!isPlaceholderData)
    motionKey.current = `${page}:${status}:${sortBy}:${search}:${isPending}:${posts.map((post) => post.id).join(",")}`;
  useContentMotion(contentRef, motionKey.current);

  useEffect(() => {
    if (
      !isPending &&
      !isPlaceholderData &&
      !error &&
      page > Math.max(1, totalPages)
    )
      onPageChange(Math.max(1, totalPages));
  }, [page, totalPages, isPending, isPlaceholderData, error, onPageChange]);

  const editBasePath =
    fixedCategoryId === 2 ? "/admin/moments" : "/admin/posts";
  const isMoments = fixedCategoryId === 2;

  // 文案：优先用传入的 labels，否则用默认的"文章"文案
  const title = labels?.title ?? m.admin_posts_title();
  const createLabel = labels?.create ?? m.admin_posts_create();
  const creatingLabel = labels?.creating ?? m.admin_posts_creating();

  // 统计文案：根据当前语言和分类类型动态拼接，不依赖 i18n
  const totalLabel = (count: number) => {
    const isEn = getLocale() === "en";
    if (isMoments) {
      return `${count} ${isEn ? "moments" : "条动态"}`;
    }
    return `${count} ${isEn ? "posts" : "篇文章"}`;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const post = await orpcClient.posts.admin.create();
      // 创建后立即设置分类
      if (fixedCategoryId) {
        await orpcClient.posts.admin.update({
          id: post.id,
          data: { categoryId: fixedCategoryId },
        });
      }
      return post;
    },
    onSuccess: (post) => {
      void queryClient.invalidateQueries({
        queryKey: orpc.posts.admin.list.key(),
      });
      void navigate({
        to: `${editBasePath}/edit/$id`,
        params: { id: String(post.id) },
      });
    },
    onError: () => toast.error(m.admin_posts_create_failed()),
  });
  const createPost = createMutation.mutate;
  const isCreating = createMutation.isPending;
  const label = isCreating ? creatingLabel : createLabel;
  useEffect(() => {
    setPrimaryAction({
      label,
      onClick: () => createPost(),
      disabled: isCreating,
    });
    return () => setPrimaryAction(null);
  }, [label, createPost, isCreating, setPrimaryAction]);
  const deleteMutation = useDeletePost({
    onSuccess: () => setPostToDelete(null),
  });
  const hasActiveFilters =
    status !== "ALL" || sortBy !== "updatedAt" || Boolean(searchInput);
  const hasContentFilter = status !== "ALL" || Boolean(search.trim());
  const isEmptyLibrary = !hasContentFilter && totalCount === 0;

  return (
    <section className="post-manager fuwari-card-base">
      <header className="post-list-heading">
        <div>
          <h1>{title}</h1>
          <p>
            {statusCounts
              ? totalLabel(statusCounts.draft + statusCounts.published)
              : "—"}
            {isFetching && (
              <Loader2
                size={14}
                className="ml-2 inline animate-spin"
                aria-hidden="true"
              />
            )}
          </p>
        </div>
        <button
          type="button"
          className="post-list-create fuwari-btn-primary"
          onClick={() => createPost()}
          disabled={isCreating}
        >
          <Plus size={19} />
          {label}
        </button>
      </header>
      <PostsToolbar
        searchTerm={searchInput}
        onSearchChange={handleSearchChange}
        searchRef={searchRef}
        status={status}
        statusCounts={statusCounts}
        onStatusChange={onStatusChange}
        sortBy={sortBy}
        onSortByChange={onSortByChange}
      />
      <div
        ref={scrollRef}
        className="post-list-scroll custom-scrollbar"
        data-scroll-restoration-id="admin-post-list"
        role="region"
        aria-label={title}
        tabIndex={0}
      >
        {error ? (
          <div className="post-list-empty">
            <p>{m.error_desc()}</p>
            <button type="button" onClick={() => void refetch()}>
              {m.error_retry()}
            </button>
          </div>
        ) : (
          <>
            <div className="post-list-table-wrap" aria-busy={isFetching}>
              <table className="post-list-table">
                <colgroup>
                  <col className="post-list-title-col" />
                  <col className="post-list-status-col" />
                  <col className="post-list-date-col" />
                  <col className="post-list-actions-col" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">{m.admin_posts_col_title()}</th>
                    <th scope="col">{m.admin_posts_filter_status()}</th>
                    <th scope="col">
                      {sortBy === "updatedAt"
                        ? m.admin_posts_sort_recent_upd()
                        : m.admin_posts_sort_recent_pub()}
                    </th>
                    <th scope="col">{m.admin_posts_col_actions()}</th>
                  </tr>
                </thead>
                <tbody ref={contentRef}>
                  {isPending ? (
                    <PostManagerSkeleton />
                  ) : (
                    posts.map((post) => (
                      <PostRow
                        key={post.id}
                        post={post}
                        sortBy={sortBy}
                        onDelete={(target, trigger) => {
                          deleteTriggerRef.current = trigger;
                          setPostToDelete(target);
                        }}
                        editBasePath={editBasePath}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!isPending && posts.length === 0 && (
              <div className="post-list-empty">
                <Search size={30} aria-hidden="true" />
                <p>
                  {isEmptyLibrary
                    ? m.admin_posts_empty_library()
                    : m.admin_posts_no_match()}
                </p>
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() =>
                    isEmptyLibrary ? createPost() : resetFilters()
                  }
                >
                  {isEmptyLibrary ? label : m.admin_posts_clear_filters()}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {!isPending && !error && (
        <footer className="post-list-footer">
          {totalPages <= 1 ? (
            <p>
              {hasContentFilter
                ? m.admin_posts_results({ count: totalCount })
                : totalLabel(totalCount)}
            </p>
          ) : (
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={ADMIN_ITEMS_PER_PAGE}
              currentPageItemCount={posts.length}
              onPageChange={onPageChange}
            />
          )}
          {hasActiveFilters && (
            <button
              type="button"
              className="post-list-reset"
              onClick={resetFilters}
            >
              {m.admin_posts_clear_filters()}
            </button>
          )}
        </footer>
      )}

      <ConfirmationModal
        isOpen={!!postToDelete}
        title={m.admin_posts_delete_confirm_title()}
        message={m.admin_posts_delete_confirm_desc({
          title: postToDelete?.title.trim() || m.common_untitled(),
        })}
        confirmLabel={m.admin_posts_delete_confirm_btn()}
        isDanger
        isLoading={deleteMutation.isPending}
        onClose={() => setPostToDelete(null)}
        onConfirm={() => {
          if (postToDelete) deleteMutation.mutate(postToDelete);
        }}
        returnFocus={() =>
          deleteTriggerRef.current?.isConnected
            ? deleteTriggerRef.current
            : searchRef.current
        }
      />
    </section>
  );
}