import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import DriveSidebar from "../components/DriveSidebar/DriveSidebar";
import FileGridView from "../components/FileGridView/FileGridView";
import FileListView from "../components/FileListView/FileListView";
import UploadArea from "../components/UploadArea/UploadArea";
import Loader from "../components/ui/Loader";

import {
  getMyBooks,
  getTrashBooks,
  moveBookToTrash,
  restoreTrash,            // ✅ UPDATED
  deleteBookPermanently,
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

  /* ================= AUTH GUARD ================= */

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  /* ================= FETCH FILES ================= */

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = isTrash ? await getTrashBooks() : await getMyBooks();
      setFiles(data);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  }, [isTrash]);

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
                {isTrash ? "Trash" : "My Files"}
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
            {isTrash ? "Trash is empty" : "No files found"}
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50">
            {viewMode === "grid" ? (
              <FileGridView
                files={filteredFiles}
                isTrash={isTrash}
                onDelete={handleDelete}
                onRestore={handleRestore}          // ✅ CORRECT
                onPermanentDelete={handlePermanentDelete}
                onOpen={handleOpen}
              />
            ) : (
              <FileListView
                files={filteredFiles}
                isTrash={isTrash}
                onDelete={handleDelete}
                onRestore={handleRestore}          // ✅ CORRECT
                onPermanentDelete={handlePermanentDelete}
                onOpen={handleOpen}
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
