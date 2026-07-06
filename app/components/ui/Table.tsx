const Table = ({ files }: { files: any[] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            <th>File Name</th>
            <th>File Type</th>
            <th>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
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
