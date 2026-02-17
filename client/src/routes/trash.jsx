import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useAuth } from "../components/auth-context";
import DriveSidebar from "../components/DriveSidebar/DriveSidebar";
import FileGridView from "../components/FileGridView/FileGridView";
import Loader from "../components/ui/Loader";
import { deleteBookPermanently, getStorageStats, getTrashBooks, restoreTrash } from "../lib/queries";

export default function Trash() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageStats, setStorageStats] = useState({
    usedStorage: 0,
    totalStorage: 15360,
  });

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const fetchTrash = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getTrashBooks();
      setFiles(data);

      try {
        const stats = await getStorageStats();
        setStorageStats({
          usedStorage: stats.usedStorage,
          totalStorage: stats.totalStorage,
        });
      } catch (error) {
        console.error("Failed to fetch storage stats:", error);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load trash");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (id) => {
    try {
      await restoreTrash(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success("File restored successfully");
    } catch (error) {
      toast.error(error.message || "Restore failed");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Delete permanently? This cannot be undone.")) return;
    try {
      await deleteBookPermanently(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      toast.success("Deleted permanently");
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DriveSidebar
        currentFolder="trash"
        onFolderClick={(folder) => {
          const folderPathMap = {
            "my-files": "/dashboard",
            recent: "/recent",
            starred: "/starred",
            trash: "/trash",
          };
          const targetPath = folderPathMap[folder] || "/dashboard";
          if (targetPath !== "/trash") {
            navigate(targetPath);
          }
        }}
        storageUsed={storageStats.usedStorage}
        storageTotal={storageStats.totalStorage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Trash</h2>
              <p className="text-sm text-gray-500">{files.length} items</p>
            </div>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-500">
            <Trash2 size={56} className="mb-4 text-gray-400" />
            <p className="text-base font-medium">Trash is empty</p>
            <p className="text-sm text-gray-500">Files you delete will appear here</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50">
            <FileGridView
              files={files}
              isTrash
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
