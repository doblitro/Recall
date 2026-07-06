"use client";
import { useState } from "react";
import Table from "../ui/Table";

const DriveFiles = () => {
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  const [files, setFiles] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchKeyword) return;
    try {
      const response = await fetch(
        `/api/google_drive/file?keyword=${searchKeyword}`,
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      setFiles([]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Google Drive Files</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search files..."
            className="border rounded px-2 py-1"
            value={searchKeyword}
            onChange={handleInputChange}
          />
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
      </div>
      <Table files={files} />
    </div>
  );
};

export default DriveFiles;
