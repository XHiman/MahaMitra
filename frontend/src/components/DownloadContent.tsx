import React from "react";
import { Link } from "react-router-dom";

type DownloadItem = {
  title: string;
  fileUrl: string; // Path to PDF (local public folder or backend URL)
};

type DownloadContentProps = {
  items: DownloadItem[];
};

const DownloadContent: React.FC<DownloadContentProps> = ({ items }) => {
  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="download-container">
      {items.map((item, index) => (
        <div key={index} className="download-item">
          <Link
            to={item.fileUrl}
            onClick={(e) => {
              e.preventDefault();
              handleDownload(item.fileUrl, item.title);
            }}
            className="download-link"
          >
            {item.title}
          </Link>
        </div>
      ))}
    </div>
  );
};

export default DownloadContent;
