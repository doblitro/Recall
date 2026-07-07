import type { drive_v3 } from "googleapis";

const Table = ({ files }: { files: any[] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>Origin</th>
            <th>File Name</th>
            <th>File Type</th>
            <th>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file: drive_v3.Schema$File) => (
            <tr key={file.id}>
              <td>{file.owners?.[0]?.emailAddress || "Unknown"}</td>
              <td>
                {file.webViewLink ? (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {file.name}
                  </a>
                ) : (
                  file.name
                )}
              </td>
              <td>{file.mimeType}</td>
              <td>{file.modifiedTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
