import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import DriveSidebar from "../components/DriveSidebar/DriveSidebar";
import FileGridView from "../components/FileGridView/FileGridView";
import Loader from "../components/ui/Loader";
import UploadArea from "../components/UploadArea/UploadArea";
import VersionHistory from "../components/VersionHistory/VersionHistory";

import {
  getMyBooks,
  getStorageStats,
  moveBookToTrash,
  toggleStar,
  updateBook
} from "../lib/queries";

import { useAuth } from "../components/auth-context";

export default function DriveDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const currentFolder = "my-files";
  const [storageStats, setStorageStats] = useState({
    usedStorage: 0,
    totalStorage: 15360 // 15GB in MB
  });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [versionHistoryFile, setVersionHistoryFile] = useState(null);

  /* ================= AUTH GUARD ================= */

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const handleFolderClick = useCallback(
    (folder) => {
      const folderPathMap = {
        "my-files": "/dashboard",
        recent: "/recent",
        starred: "/starred",
        trash: "/trash",
      };
      const targetPath = folderPathMap[folder] || "/dashboard";
      navigate(targetPath);
    },
    [navigate],
  );

  /* ================= FETCH FILES ================= */

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMyBooks();

      setFiles(data);

      // Fetch storage stats
      try {
        const stats = await getStorageStats();
        setStorageStats({
          usedStorage: stats.usedStorage,
          totalStorage: stats.totalStorage
        });
      } catch (error) {
        console.error("Failed to fetch storage stats:", error);
      }
    } catch {
      toast.error("Failed to load files");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  /* ================= ACTIONS ================= */

  const handleFileUpload = useCallback(async (newFile) => {
    setFiles((prev) => [newFile, ...prev]);

    // Refresh storage stats after upload
    try {
      const stats = await getStorageStats();
      setStorageStats({
        usedStorage: stats.usedStorage,
        totalStorage: stats.totalStorage
      });
    } catch (error) {
      console.error("Failed to refresh storage stats:", error);
    }
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

  //============================ summaryText==========================

  const handleSummarizePDF = async (file) => {
    if (!file.fileUrl) {
      toast.error("File URL not available");
      return;
    }

    try {
      setVersionHistoryFile(null);
      setIsSummarizing(true);
      setSummaryText("");
      setShowSummaryModal(true);

      // 1️⃣ Fetch the PDF as blob
      const pdfResponse = await fetch(file.fileUrl);
      const pdfBlob = await pdfResponse.blob();

      // 2️⃣ Convert to File
      const pdfFile = new File([pdfBlob], file.title || "document.pdf", {
        type: "application/pdf",
      });

      // 3️⃣ Send to backend
      const formData = new FormData();
      formData.append("pdf", pdfFile);

      const response = await fetch(
        "http://localhost:3000/api/books/summary",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to summarize PDF");
      }

      setSummaryText(data.summary);
    } catch (error) {
      toast.error(error.message || "PDF summarization failed");
      setShowSummaryModal(false);
    } finally {
      setIsSummarizing(false);
    }
  };
  const handleVersionHistory = (file) => {
    setShowSummaryModal(false);
    setSummaryText("");
    setVersionHistoryFile(file);
  };

  const handleVersionChange = async () => {
    // Refresh the files list after version changes
    await fetchFiles();
  };


  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <DriveSidebar
        currentFolder={currentFolder}
        onFolderClick={handleFolderClick}
        storageUsed={storageStats.usedStorage}
        storageTotal={storageStats.totalStorage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                My Files
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

            <UploadArea
              onFileUpload={handleFileUpload}
              isUploading={false}
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredFiles.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            No files found
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50">
            <FileGridView
              files={filteredFiles}
              onDelete={handleDelete}
              onOpen={handleOpen}
              onDownload={handleDownload}
              onShare={handleShare}
              onRename={handleRename}
              onToggleStar={handleToggleStar}
              onSummarize={handleSummarizePDF}
              onVersionHistory={handleVersionHistory}
            />
          </div>
        )}
      </div>

      {/* PDF Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">📄 PDF Summary</h3>

            {isSummarizing ? (
              <div className="flex justify-center py-10">
                <Loader />
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
                {summaryText}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {versionHistoryFile && (
        <VersionHistory
          file={versionHistoryFile}
          onClose={() => setVersionHistoryFile(null)}
          onVersionChange={handleVersionChange}
        />
      )}

    </div>
  );
}
