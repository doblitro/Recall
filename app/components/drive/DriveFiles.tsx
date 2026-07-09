"use client";

import { useState } from "react";
import Table, { Column } from "../ui/Table";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import useConnectorSearch from "@/app/hooks/useConnectorSearch";
import useConnectorDetail from "@/app/hooks/useConnectorDetail";
import { DriveListItem, DriveDetailItem } from "@/lib/connectors/types";
import Link from "../ui/Link";

const columns: Column<DriveListItem>[] = [
  {
    header: "Origin",
    render: (file) => file.accountEmail || "Unknown",
  },
  {
    header: "File Name",
    render: (file) =>
      file.url ? (
        <Link
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          showIcon
        >
          <span dangerouslySetInnerHTML={{ __html: file.title }} />
        </Link>
      ) : (
        <span dangerouslySetInnerHTML={{ __html: file.title }} />
      ),
  },
  {
    header: "File Type",
    render: (file) => file.metadata.mimeType,
  },
  {
    header: "Last Modified",
    render: (file) => file.updatedAt,
  },
];

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

const DriveFiles = ({ searchKeyword }: { searchKeyword: string }) => {
  const files = useConnectorSearch<DriveListItem>(
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

  const handleRowClick = (file: DriveListItem) => {
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
  };

  return (
    <div className="flex flex-col gap-4">
      <Table
        items={files}
        columns={columns}
        isRowExpanded={(file) => file.id === expandedId}
        onRowClick={handleRowClick}
        renderDetail={(file) =>
          file.id === expandedId ? (
            <FileDetail detail={detail} loading={loading} error={error} />
          ) : null
        }
      />
    </div>
  );
};

export default DriveFiles;
