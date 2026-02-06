import {
  Archive,
  Code,
  Download,
  File,
  FileText,
  Heart,
  Image,
  Music,
  RotateCcw,
  Share2,
  Trash2,
  Video
} from "lucide-react";
import { useState } from "react";

/* ================= FILE ICON ================= */

function getFileIcon(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase() || "";

  if (["pdf", "doc", "docx", "txt"].includes(ext))
    return <FileText size={32} className="text-red-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <Image size={32} className="text-purple-500" />;
  if (["mp3", "wav", "flac"].includes(ext))
    return <Music size={32} className="text-green-500" />;
  if (["mp4", "avi", "mov", "webm"].includes(ext))
    return <Video size={32} className="text-blue-500" />;
  if (["zip", "rar", "7z"].includes(ext))
    return <Archive size={32} className="text-yellow-500" />;
  if (["js", "ts", "py", "java", "cpp"].includes(ext))
    return <Code size={32} className="text-orange-500" />;

  return <File size={32} className="text-gray-500" />;
}

/* ================= GRID VIEW ================= */

export default function FileGridView({
  files,
  isTrash = false,
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  onShare,
  onRename,
  onOpen,
  onToggleStar,
  onSummarize
}) {
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);
  const [hoveredFile, setHoveredFile] = useState(null);

  const toggleSelect = (id) => {
    const s = new Set(selectedFiles);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedFiles(s);
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {files.map((file) => (
          <FileGridItem
            key={file._id}
            file={file}
            isTrash={isTrash}
            isSelected={selectedFiles.has(file._id)}
            isHovered={hoveredFile === file._id}
            onToggleSelect={() => toggleSelect(file._id)}
            onContextMenu={(e) => handleContextMenu(e, file)}
            onMouseEnter={() => setHoveredFile(file._id)}
            onMouseLeave={() => setHoveredFile(null)}
            onDownload={() => onDownload?.(file)}
            onDelete={() => onDelete?.(file._id)}
            onRestore={() => onRestore?.(file._id)}
            onPermanentDelete={() => onPermanentDelete?.(file._id)}
            onShare={() => onShare?.(file)}
            onOpen={() => onOpen?.(file)}
            onToggleStar={() => onToggleStar?.(file)}
            onSummarize={() => onSummarize?.(file)}
          />
        ))}
      </div>

      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          isTrash={isTrash}
          onDownload={onDownload}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onShare={onShare}
          onToggleStar={onToggleStar}
          onSummarize={onSummarize}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

/* ================= GRID ITEM ================= */

function FileGridItem({
  file,
  isTrash,
  isSelected,
  isHovered,
  onToggleSelect,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  onShare,
  onOpen,
  onToggleStar,
  onSummarize
}) {
  const isPDF = file.fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:-translate-y-1 hover:shadow-lg"
      }`}
      onClick={onToggleSelect}
    >
      <div
        className="flex justify-center mb-3"
        onClick={(e) => {
          e.stopPropagation();
          !isTrash && onOpen();
        }}
      >
        <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition">
          {getFileIcon(file.fileName)}
        </div>
      </div>

      <p className="text-xs font-medium truncate text-center text-gray-700">
        {file.title}
      </p>

      {isHovered && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {isPDF && (
            <ActionButton
              icon={<FileText size={16} />}
              title="Summarize PDF"
              onClick={(e) => {
                e.stopPropagation();
                onSummarize();
              }}
            />
          )}
          <ActionButton icon={<Download size={16} />} onClick={onDownload} />
          <ActionButton icon={<Share2 size={16} />} onClick={onShare} />
          <ActionButton
            icon={<Trash2 size={16} />}
            className="text-red-600 hover:bg-red-50"
            onClick={onDelete}
          />
        </div>
      )}

      {!isTrash && (
        <div className="absolute top-2 right-2">
          <ActionButton
            icon={
              <Heart
                size={16}
                className={
                  file.isStarred
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400"
                }
              />
            }
            onClick={onToggleStar}
          />
        </div>
      )}
    </div>
  );
}

/* ================= CONTEXT MENU ================= */

function ContextMenu({
  x,
  y,
  file,
  isTrash,
  onDownload,
  onDelete,
  onRestore,
  onPermanentDelete,
  onShare,
  onToggleStar,
  onSummarize,
  onClose
}) {
  const isPDF = file.fileName?.toLowerCase().endsWith(".pdf");

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="fixed z-20 min-w-[220px] rounded-xl border border-gray-200 bg-white/90 backdrop-blur shadow-xl py-2 animate-in fade-in zoom-in"
        style={{ left: x, top: y }}
      >
        {!isTrash && isPDF && (
          <MenuItem
            icon={<FileText size={16} />}
            label="Summarize PDF"
            onClick={() => {
              onSummarize(file);
              onClose();
            }}
          />
        )}
        <MenuItem
          icon={<Download size={16} />}
          label="Download"
          onClick={() => {
            onDownload(file);
            onClose();
          }}
        />
        <MenuItem
          icon={<Share2 size={16} />}
          label="Share"
          onClick={() => {
            onShare(file);
            onClose();
          }}
        />
        <MenuItem
          icon={<Trash2 size={16} />}
          label="Move to Trash"
          className="text-red-600"
          onClick={() => {
            onDelete(file._id);
            onClose();
          }}
        />
      </div>
    </>
  );
}

function ActionButton({ icon, onClick, title, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg bg-white/90 p-1.5 shadow transition hover:scale-105 hover:bg-white hover:shadow-md ${className}`}
    >
      {icon}
    </button>
  );
}

function MenuItem({ icon, label, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
