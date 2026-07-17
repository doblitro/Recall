"use client";

import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import ResultCard from "@/app/components/ui/ResultCard";
import LinkedTitle from "@/app/components/ui/LinkedTitle";
import useConnectorDetail from "@/app/hooks/useConnectorDetail";
import {
  GMAIL_PROVIDER_ID,
  GOOGLE_DRIVE_PROVIDER_ID,
} from "@/lib/connectors/public";
import { GmailDetailItem, DriveDetailItem } from "@/lib/connectors/types";
import { MergedResultItem } from "@/app/components/results/types";

export interface SearchResultItem {
  id: string;
  provider: string;
  kind: string;
  integrationId: string;
  accountEmail: string | null;
  title: string;
  subtitle?: string;
  preview?: string;
  url: string | null;
  updatedAt: string;
  metadata: unknown;
}

interface SearchPage {
  items: SearchResultItem[];
  hasMore: boolean;
}

const MessageDetail = ({
  detail,
  loading,
  error,
}: {
  detail: GmailDetailItem | null;
  loading: boolean;
  error: string | null;
}) => {
  if (loading) return <div className="py-2 text-sm">Loading…</div>;
  if (error) return <div className="text-danger py-2 text-sm">{error}</div>;
  if (!detail) return null;

  const { metadata } = detail;

  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      {metadata.toDisplay && (
        <div>
          <strong>To:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.toDisplay }} />
        </div>
      )}
      {metadata.ccDisplay && (
        <div>
          <strong>Cc:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.ccDisplay }} />
        </div>
      )}
      {metadata.bccDisplay && (
        <div>
          <strong>Bcc:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.bccDisplay }} />
        </div>
      )}
      {metadata.replyToDisplay && (
        <div>
          <strong>Reply-To:</strong>{" "}
          <span dangerouslySetInnerHTML={{ __html: metadata.replyToDisplay }} />
        </div>
      )}
      {metadata.messageId && (
        <div>
          <strong>Message-ID:</strong> {metadata.messageId}
        </div>
      )}
      {metadata.attachments.length > 0 && (
        <div>
          <strong>Attachments:</strong>{" "}
          {metadata.attachments.map((a, index) => (
            <span key={index}>
              {index > 0 && ", "}
              <span dangerouslySetInnerHTML={{ __html: a.filename }} />
            </span>
          ))}
        </div>
      )}
      <div>
        <strong>Body:</strong>
        <div
          className="max-h-96 overflow-y-auto whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: metadata.bodyHtml }}
        />
      </div>
    </div>
  );
};

const FileDetail = ({
  detail,
  loading,
  error,
}: {
  detail: DriveDetailItem | null;
  loading: boolean;
  error: string | null;
}) => {
  if (loading) return <div className="py-2 text-sm">Loading…</div>;
  if (error) return <div className="text-danger py-2 text-sm">{error}</div>;
  if (!detail) return null;

  const { metadata } = detail;

  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      {metadata.description && (
        <div>
          <strong>Description:</strong> {metadata.description}
        </div>
      )}
      {metadata.size && (
        <div>
          <strong>Size:</strong> {metadata.size} bytes
        </div>
      )}
      {metadata.owners.length > 0 && (
        <div>
          <strong>Owners:</strong>{" "}
          {metadata.owners.map((o) => o.name ?? o.email).join(", ")}
        </div>
      )}
      {metadata.lastModifyingUser && (
        <div>
          <strong>Last modified by:</strong>{" "}
          {metadata.lastModifyingUser.name ?? metadata.lastModifyingUser.email}
        </div>
      )}
    </div>
  );
};

const useSearchResults = (
  searchKeyword: string,
  activeProvider: string | null,
) => {
  const query = useInfiniteQuery({
    queryKey: ["search", searchKeyword, activeProvider],
    queryFn: async ({ pageParam, signal }): Promise<SearchPage> => {
      const params = new URLSearchParams({
        keyword: searchKeyword,
        page: String(pageParam),
      });
      if (activeProvider) params.set("provider", activeProvider);

      const response = await fetch(`/api/search?${params.toString()}`, {
        signal,
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error ?? "Search failed");

      return {
        items: (json.items ?? []) as SearchResultItem[],
        hasMore: !!json.hasMore,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    enabled: !!searchKeyword,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const countsQuery = useQuery({
    queryKey: ["search-counts", searchKeyword],
    queryFn: async (): Promise<Record<string, number>> => {
      const params = new URLSearchParams({ keyword: searchKeyword });
      const response = await fetch(`/api/search/counts?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error ?? "Search failed");
      return (json.counts ?? {}) as Record<string, number>;
    },
    enabled: !!searchKeyword,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const results = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const gmailDetail = useConnectorDetail<GmailDetailItem>("message");
  const driveDetail = useConnectorDetail<DriveDetailItem>("file");

  const handleRowClick = useCallback(
    (item: SearchResultItem) => {
      const key = `${item.provider}:${item.id}`;
      if (expandedKey === key) {
        setExpandedKey(null);
        gmailDetail.reset();
        driveDetail.reset();
        return;
      }

      setExpandedKey(key);
      if (item.provider === GMAIL_PROVIDER_ID) {
        gmailDetail.fetchDetail(
          `/api/connectors/${GMAIL_PROVIDER_ID}/messages/${item.id}`,
          { integrationId: item.integrationId, keyword: searchKeyword },
        );
      } else if (item.provider === GOOGLE_DRIVE_PROVIDER_ID) {
        driveDetail.fetchDetail(
          `/api/connectors/${GOOGLE_DRIVE_PROVIDER_ID}/file/${item.id}`,
          { integrationId: item.integrationId, keyword: searchKeyword },
        );
      }
    },
    [expandedKey, gmailDetail, driveDetail, searchKeyword],
  );

  const items = useMemo<MergedResultItem[]>(
    () =>
      results.map((item) => {
        const key = `${item.provider}:${item.id}`;
        return {
          id: item.id,
          provider: item.provider,
          updatedAt: item.updatedAt,
          card: (
            <ResultCard
              key={key}
              provider={item.provider}
              title={
                <LinkedTitle url={item.url ?? undefined} html={item.title} />
              }
              subtitle={
                item.subtitle && (
                  <span dangerouslySetInnerHTML={{ __html: item.subtitle }} />
                )
              }
              preview={
                item.preview && (
                  <span dangerouslySetInnerHTML={{ __html: item.preview }} />
                )
              }
              date={item.updatedAt}
              footer={item.accountEmail || "Unknown"}
              expanded={key === expandedKey}
              onClick={() => handleRowClick(item)}
              renderDetail={() => {
                if (key !== expandedKey) return null;
                if (item.provider === GMAIL_PROVIDER_ID) {
                  return (
                    <MessageDetail
                      detail={gmailDetail.data}
                      loading={gmailDetail.loading}
                      error={gmailDetail.error}
                    />
                  );
                }
                if (item.provider === GOOGLE_DRIVE_PROVIDER_ID) {
                  return (
                    <FileDetail
                      detail={driveDetail.data}
                      loading={driveDetail.loading}
                      error={driveDetail.error}
                    />
                  );
                }
                return null;
              }}
            />
          ),
        };
      }),
    [
      results,
      expandedKey,
      gmailDetail.data,
      gmailDetail.loading,
      gmailDetail.error,
      driveDetail.data,
      driveDetail.loading,
      driveDetail.error,
      handleRowClick,
    ],
  );

  return {
    items,
    isFetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    loadMore: () => query.fetchNextPage(),
    isError: query.isError,
    counts: countsQuery.data,
  };
};

export default useSearchResults;
