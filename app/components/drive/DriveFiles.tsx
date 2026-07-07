"use client";

import { useEffect, useState } from "react";
import Table, { Column } from "../ui/Table";
import { GOOGLE_DRIVE_PROVIDER_ID } from "@/lib/connectors/public";
import { drive_v3 } from "googleapis";

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
  const [files, setFiles] = useState<DriveFile[]>([]);

  useEffect(() => {
    if (!searchKeyword) {
      setFiles([]);
      return;
    }

    let cancelled = false;

    const fetchFiles = async () => {
      try {
        const response = await fetch(
          `/api/connectors/${GOOGLE_DRIVE_PROVIDER_ID}/file?keyword=${searchKeyword}`,
        );
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        if (!cancelled) setFiles(data.files || []);
      } catch (error) {
        console.error("Error fetching files:", error);
        if (!cancelled) setFiles([]);
      }
    };

    fetchFiles();

    return () => {
      cancelled = true;
    };
  }, [searchKeyword]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Google Drive Files</h2>
      <Table items={files} columns={columns} />
    </div>
  );
};

export default DriveFiles;
