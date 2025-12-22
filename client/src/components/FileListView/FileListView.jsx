import React from "react";
import {
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Code,
  File,
  Download,
  Trash2,
  Share2,
} from "lucide-react";

function getFileIcon(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";

  if (["pdf", "doc", "docx", "txt"].includes(ext)) return <FileText size={16} className="text-red-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <Image size={16} className="text-purple-500" />;
  if (["mp3", "wav", "flac"].includes(ext)) return <Music size={16} className="text-green-500" />;
  if (["mp4", "avi", "mov", "webm"].includes(ext)) return <Video size={16} className="text-blue-500" />;
  if (["zip", "rar", "7z"].includes(ext)) return <Archive size={16} className="text-yellow-500" />;
  if (["js", "ts", "py", "java", "cpp"].includes(ext)) return <Code size={16} className="text-orange-500" />;

  return <File size={16} className="text-gray-500" />;
}

export default function FileListView({
  files,
  onDownload,
  onDelete,
  onShare,
  onRename,
  onOpen,
  sortBy = "name",
  sortOrder = "asc",
  onSort,
}) {
  const sortedFiles = [...files].sort((a, b) => {
    let aVal = sortBy === "name" ? a.title : a.createdAt;
    let bVal = sortBy === "name" ? b.title : b.createdAt;

    if (sortBy === "date") {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <div className="p-6">
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileText size={64} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No files here</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 w-12">
                  <input type="checkbox" className="w-4 h-4" />
                </th>
                <th
                  className="px-6 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => onSort("name")}
                >
                  Name {sortBy === "name" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                </th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700 w-32">Owner</th>
                <th
                  className="px-6 py-3 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 w-40"
                  onClick={() => onSort("date")}
                >
                  Modified {sortBy === "date" && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file, idx) => (
                <FileListItem
                  key={file._id}
                  file={file}
                  isLast={idx === sortedFiles.length - 1}
                  onDownload={() => onDownload(file)}
                  onDelete={() => onDelete(file._id)}
                  onShare={() => onShare(file)}
                  onRename={() => onRename(file)}
                  onOpen={() => onOpen(file)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FileListItem({
  file,
  isLast,
  onDownload,
  onDelete,
  onShare,
  onOpen,
}) {
  const [showActions, setShowActions] = React.useState(false);

  return (
    <tr
      className={`hover:bg-blue-50 transition ${!isLast ? "border-b border-gray-100" : ""}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <td className="px-6 py-3">
        <input type="checkbox" className="w-4 h-4" />
      </td>
      <td
        className="px-6 py-3 flex items-center gap-3 cursor-pointer"
        onClick={onOpen}
      >
        {getFileIcon(file.fileName)}
        <span className="font-medium text-gray-900 truncate">{file.title}</span>
      </td>
      <td className="px-6 py-3 text-gray-600">{file.author}</td>
      <td className="px-6 py-3 text-gray-600">
        {new Date(file.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-3 text-right">
        {showActions && (
          <div className="flex justify-end gap-2">
            <ActionIconButton
              icon={<Download size={16} />}
              onClick={onDownload}
              title="Download"
            />
            <ActionIconButton
              icon={<Share2 size={16} />}
              onClick={onShare}
              title="Share"
            />
            <ActionIconButton
              icon={<Trash2 size={16} />}
              onClick={onDelete}
              title="Delete"
              className="text-red-600 hover:text-red-700"
            />
          </div>
        )}
      </td>
    </tr>
  );
}

function ActionIconButton({ icon, onClick, title, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`p-1 rounded hover:bg-gray-200 text-gray-600 transition ${className}`}
      title={title}
    >
      {icon}
    </button>
  );
}
