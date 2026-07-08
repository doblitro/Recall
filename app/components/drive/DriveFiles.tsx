"use client";

import Table, { Column } from "../ui/Table";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import type { drive_v3 } from "@googleapis/drive";
import useConnectorSearch from "@/app/hooks/useConnectorSearch";

export type DriveFile = drive_v3.Schema$File & { accountEmail?: string };

const columns: Column<DriveFile>[] = [
  {
    header: "Origin",
    render: (file) => file.accountEmail || "Unknown",
  },
  {
    header: "File Name",
    render: (file) =>
      file.webViewLink ? (
        <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
          {file.name}
        </a>
      ) : (
        file.name
      ),
  },
  {
    header: "File Type",
    render: (file) => file.mimeType,
  },
  {
    header: "Last Modified",
    render: (file) => file.modifiedTime,
  },
];

const DriveFiles = ({ searchKeyword }: { searchKeyword: string }) => {
  const files = useConnectorSearch<DriveFile>(
    `/api/connectors/${GOOGLE_DRIVE_PROVIDER_ID}/file`,
    "files",
    searchKeyword,
  );

  return (
    <div className="flex flex-col gap-4">
      <Table items={files} columns={columns} />
    </div>
  );
};

export default DriveFiles;
