import { useState } from "react";
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
  Heart,
  RotateCcw
} from "lucide-react";

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
  onOpen
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
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FileText size={64} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">
            {isTrash ? "Trash is empty" : "No files here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          isTrash={isTrash}
          onDownload={onDownload}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onShare={onShare}
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
  onOpen
}) {
  return (
    <div
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative p-3 rounded-lg border-2 cursor-pointer transition ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-transparent hover:border-gray-200 bg-gray-50"
      }`}
      onClick={onToggleSelect}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* File Icon */}
      <div
        className="flex justify-center mb-2"
        onClick={(e) => {
          e.stopPropagation();
          !isTrash && onOpen();
        }}
      >
        {getFileIcon(file.fileName)}
      </div>

      {/* Name */}
      <p className="text-xs font-medium truncate text-center">{file.title}</p>
      <p className="text-xs text-gray-500 text-center truncate">
        {file.author}
      </p>

      {/* ACTIONS */}
      {isHovered && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {isTrash ? (
            <>
              <ActionButton
                icon={<RotateCcw size={16} />}
                title="Restore"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore();
                }}
              />
              <ActionButton
                icon={<Trash2 size={16} />}
                title="Delete forever"
                className="text-red-600 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onPermanentDelete();
                }}
              />
            </>
          ) : (
            <>
              <ActionButton
                icon={<Download size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
              />
              <ActionButton
                icon={<Share2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
              />
              <ActionButton
                icon={<Trash2 size={16} />}
                className="text-red-600 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              />
            </>
          )}
        </div>
      )}

      {/* Star */}
      {!isTrash && isHovered && (
        <div className="absolute top-2 right-2">
          <ActionButton icon={<Heart size={16} />} />
        </div>
      )}
    </div>
  );
}

/* ================= ACTION BUTTON ================= */

function ActionButton({ icon, onClick, title, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded bg-white hover:bg-gray-100 shadow ${className}`}
    >
      {icon}
    </button>
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
  onClose
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div
        className="fixed z-20 bg-white rounded-lg shadow border py-2 min-w-[200px]"
        style={{ left: x, top: y }}
      >
        {isTrash ? (
          <>
            <MenuItem
              icon={<RotateCcw size={16} />}
              label="Restore"
              onClick={() => {
                onRestore(file._id);
                onClose();
              }}
            />
            <MenuItem
              icon={<Trash2 size={16} />}
              label="Delete forever"
              className="text-red-600"
              onClick={() => {
                onPermanentDelete(file._id);
                onClose();
              }}
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
