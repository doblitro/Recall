"use client";

import { useCallback, useMemo, useState } from "react";
import ResultCard from "../ui/ResultCard";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import useConnectorSearch from "@/app/hooks/useConnectorSearch";
import useConnectorDetail from "@/app/hooks/useConnectorDetail";
import useConnections from "@/app/hooks/useConnections";
import { DriveListItem, DriveDetailItem } from "@/lib/connectors/types";
import LinkedTitle from "../ui/LinkedTitle";
import { MergedResultItem } from "../results/types";

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
  if (error) return <div className="py-2 text-sm text-danger">{error}</div>;
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

const useDriveResults = (
  searchKeyword: string,
): { items: MergedResultItem[]; count: number; isFetching: boolean } => {
  const { connections } = useConnections(GOOGLE_DRIVE_PROVIDER_ID);
  const { data: files, isFetching } = useConnectorSearch<DriveListItem>(
    `/api/connectors/${GOOGLE_DRIVE_PROVIDER_ID}/file`,
    "files",
    searchKeyword,
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const {
    data: detail,
    loading,
    error,
    fetchDetail,
    reset,
  } = useConnectorDetail<DriveDetailItem>("file");

  const handleRowClick = useCallback(
    (file: DriveListItem) => {
      if (expandedId === file.id) {
        setExpandedId(null);
        reset();
        return;
      }

      setExpandedId(file.id ?? null);
      fetchDetail(`/api/connectors/${GOOGLE_DRIVE_PROVIDER_ID}/file/${file.id}`, {
        integrationId: file.integrationId,
        keyword: searchKeyword,
      });
    },
    [expandedId, reset, fetchDetail, searchKeyword],
  );

  const items = useMemo<MergedResultItem[]>(() => {
    if (connections.length === 0) return [];

    return files.map((file) => ({
      id: file.id,
      provider: GOOGLE_DRIVE_PROVIDER_ID,
      updatedAt: file.updatedAt,
      card: (
        <ResultCard
          key={file.id}
          provider={GOOGLE_DRIVE_PROVIDER_ID}
          title={<LinkedTitle url={file.url} html={file.title} />}
          subtitle={file.metadata.mimeType}
          date={file.updatedAt}
          footer={file.accountEmail || "Unknown"}
          expanded={file.id === expandedId}
          onClick={() => handleRowClick(file)}
          renderDetail={() =>
            file.id === expandedId ? (
              <FileDetail detail={detail} loading={loading} error={error} />
            ) : null
          }
        />
      ),
    }));
  }, [
    connections.length,
    files,
    expandedId,
    detail,
    loading,
    error,
    handleRowClick,
  ]);

  return {
    items,
    count: items.length,
    isFetching: connections.length > 0 && isFetching,
  };
};

export default useDriveResults;
