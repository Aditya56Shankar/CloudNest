import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import DriveSidebar from "../components/DriveSidebar/DriveSidebar";
import FileGridView from "../components/FileGridView/FileGridView";
import FileListView from "../components/FileListView/FileListView";
import UploadArea from "../components/UploadArea/UploadArea";
import Loader from "../components/ui/Loader";

import {
  deleteBookPermanently,
  getMyBooks,
  getRecentBooks,
  getStarredBooks,
  getTrashBooks,
  moveBookToTrash,
  restoreTrash,
  toggleStar,
  updateBook
} from "../lib/queries";

import { useAuth } from "../components/auth-context";

export default function DriveDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading] = useState(false);
  const [viewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState("my-files");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const isTrash = currentFolder === "trash";
  const isStarred = currentFolder === "starred";
  const isRecent = currentFolder === "recent";

  /* ================= AUTH GUARD ================= */

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  /* ================= FETCH FILES ================= */

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      let data;

      if (isTrash) {
        data = await getTrashBooks();
      } else if (isStarred) {
        data = await getStarredBooks();
      } else if (isRecent) {
        data = await getRecentBooks();
      } else {
        data = await getMyBooks();
      }

      setFiles(data);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  }, [isTrash, isStarred, isRecent]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  /* ================= ACTIONS ================= */

  const handleFileUpload = useCallback((newFile) => {
    setFiles((prev) => [newFile, ...prev]);
  }, []);

  // ♻️ MOVE TO TRASH
  const handleDelete = async (id) => {
    if (!window.confirm("Move file to Trash?")) return;
    try {
      await moveBookToTrash(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success("Moved to Trash");
    } catch {
      toast.error("Failed to move file");
    }
  };

  // 🔄 RESTORE FROM TRASH (✅ FIXED)
  const handleRestore = async (id) => {
    try {
      await restoreTrash(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success("File restored successfully");
    } catch (error) {
      toast.error(error.message || "Restore failed");
    }
  };

  // ❌ PERMANENT DELETE
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Delete permanently? This cannot be undone.")) return;
    try {
      await deleteBookPermanently(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success("Deleted permanently");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleRename = async (file) => {
    const newName = prompt("Enter new name:", file.title);
    if (!newName || newName === file.title) return;

    try {
      const formData = new FormData();
      formData.append("title", newName);
      formData.append("author", file.author);
      formData.append("description", file.description);

      const updated = await updateBook(file._id, formData);
      setFiles((prev) =>
        prev.map((f) => (f._id === file._id ? updated : f))
      );
      toast.success("Renamed");
    } catch {
      toast.error("Rename failed");
    }
  };

  const handleOpen = (file) => {
    if (file.fileUrl) window.open(file.fileUrl, "_blank");
  };

  const handleDownload = async (file) => {
    if (!file.fileUrl) {
      toast.error("File URL not available");
      return;
    }

    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = file.fileUrl;
      link.download = file.fileName || file.title || "download";
      link.target = "_blank";

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      toast.error("Download failed");
    }
  };

  const handleShare = async (file) => {
    if (!file.fileUrl) {
      toast.error("File URL not available");
      return;
    }

    try {
      // Check if the Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: file.title,
          text: `Check out this file: ${file.title}`,
          url: file.fileUrl,
        });
        toast.success("Shared successfully");
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(file.fileUrl);
        toast.success("Link copied to clipboard");
      }
    } catch (error) {
      // If user cancels share or clipboard fails, copy manually
      if (error.name === "AbortError") {
        // User cancelled the share, do nothing
        return;
      }

      // Final fallback: show the URL in a prompt
      const dummy = document.createElement("input");
      document.body.appendChild(dummy);
      dummy.value = file.fileUrl;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      toast.success("Link copied to clipboard");
    }
  };

  const handleToggleStar = async (file) => {
    try {
      console.log("Toggling star for file:", file._id);
      const result = await toggleStar(file._id);
      console.log("Toggle star result:", result);

      // Update local state
      setFiles((prev) =>
        prev.map((f) =>
          f._id === file._id ? { ...f, isStarred: !f.isStarred } : f
        )
      );

      // If we're in starred view and file is unstarred, remove it
      if (isStarred && file.isStarred) {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
      }

      toast.success(result.message || (file.isStarred ? "Unstarred" : "Starred"));
    } catch (error) {
      console.error("Toggle star error:", error);
      toast.error(error.message || "Failed to update star status");
    }
  };

  /* ================= FILTER ================= */

  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.author.toLowerCase().includes(q)
    );
  }, [files, searchQuery]);

  /* ================= LOADING ================= */

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DriveSidebar
        currentFolder={currentFolder}
        onFolderClick={setCurrentFolder}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {isTrash ? "Trash" : isStarred ? "Starred" : isRecent ? "Recent" : "My Files"}
              </h2>
              <p className="text-sm text-gray-500">
                {filteredFiles.length} items
              </p>
            </div>

            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md rounded-lg border px-4 py-2"
            />

            {!isTrash && (
              <UploadArea
                onFileUpload={handleFileUpload}
                isUploading={isUploading}
              />
            )}
          </div>
        </div>

        {/* Empty State */}
        {filteredFiles.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            {isTrash ? "Trash is empty" : isStarred ? "No starred files" : isRecent ? "No recent files" : "No files found"}
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50">
            {viewMode === "grid" ? (
              <FileGridView
                files={filteredFiles}
                isTrash={isTrash}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                onOpen={handleOpen}
                onDownload={handleDownload}
                onShare={handleShare}
                onRename={handleRename}
                onToggleStar={handleToggleStar}
              />
            ) : (
              <FileListView
                files={filteredFiles}
                isTrash={isTrash}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                onOpen={handleOpen}
                onDownload={handleDownload}
                onShare={handleShare}
                onRename={handleRename}
                onToggleStar={handleToggleStar}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(by) => {
                  setSortOrder(
                    sortBy === by && sortOrder === "asc" ? "desc" : "asc"
                  );
                  setSortBy(by);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
