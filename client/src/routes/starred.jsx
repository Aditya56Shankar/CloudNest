import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import DriveSidebar from "../components/DriveSidebar/DriveSidebar";
import FileGridView from "../components/FileGridView/FileGridView";
import FileListView from "../components/FileListView/FileListView";
import UploadArea from "../components/UploadArea/UploadArea";
import { useAuth } from "../components/auth-context";
import Loader from "../components/ui/Loader";

import {
    getStarredBooks,
    getStorageStats,
    moveBookToTrash,
    toggleStar,
    updateBook
} from "../lib/queries";

export default function Starred() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading] = useState(false);
    const [viewMode] = useState("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [storageStats, setStorageStats] = useState({
        usedStorage: 0,
        totalStorage: 15360,
    });
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryText, setSummaryText] = useState("");
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    useEffect(() => {
        if (!user) navigate("/");
    }, [user, navigate]);

    const fetchStarred = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getStarredBooks();
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
        } catch {
            toast.error("Failed to load files");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStarred();
    }, [fetchStarred]);

    const handleFileUpload = useCallback(async (newFile) => {
        setFiles((prev) => [newFile, ...prev]);

        try {
            const stats = await getStorageStats();
            setStorageStats({
                usedStorage: stats.usedStorage,
                totalStorage: stats.totalStorage,
            });
        } catch (error) {
            console.error("Failed to refresh storage stats:", error);
        }
    }, []);

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
            const link = document.createElement("a");
            link.href = file.fileUrl;
            link.download = file.fileName || file.title || "download";
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download started");
        } catch {
            toast.error("Download failed");
        }
    };

    const handleShare = async (file) => {
        if (!file.fileUrl) {
            toast.error("File URL not available");
            return;
        }

        try {
            if (navigator.share) {
                await navigator.share({
                    title: file.title,
                    text: `Check out this file: ${file.title}`,
                    url: file.fileUrl,
                });
                toast.success("Shared successfully");
            } else {
                await navigator.clipboard.writeText(file.fileUrl);
                toast.success("Link copied to clipboard");
            }
        } catch (error) {
            if (error.name === "AbortError") return;

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
            const result = await toggleStar(file._id);

            setFiles((prev) => prev.filter((f) => f._id !== file._id));

            toast.success(result.message || (file.isStarred ? "Unstarred" : "Starred"));
        } catch (error) {
            console.error("Toggle star error:", error);
            toast.error(error.message || "Failed to update star status");
        }
    };

    const filteredFiles = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return files.filter(
            (f) =>
                f.title.toLowerCase().includes(q) ||
                f.author.toLowerCase().includes(q)
        );
    }, [files, searchQuery]);

    const handleSummarizePDF = async (file) => {
        if (!file.fileUrl) {
            toast.error("File URL not available");
            return;
        }

        try {
            setIsSummarizing(true);
            setSummaryText("");
            setShowSummaryModal(true);

            const pdfResponse = await fetch(file.fileUrl);
            const pdfBlob = await pdfResponse.blob();

            const pdfFile = new File([pdfBlob], file.title || "document.pdf", {
                type: "application/pdf",
            });

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
                currentFolder="starred"
                onFolderClick={(folder) => {
                    const folderPathMap = {
                        "my-files": "/dashboard",
                        recent: "/recent",
                        starred: "/starred",
                        trash: "/trash",
                    };
                    const targetPath = folderPathMap[folder] || "/dashboard";
                    navigate(targetPath);
                }}
                storageUsed={storageStats.usedStorage}
                storageTotal={storageStats.totalStorage}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b bg-white px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">Starred</h2>
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
                            isUploading={isUploading}
                        />
                    </div>
                </div>

                {filteredFiles.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-gray-500">
                        No starred files
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto bg-gray-50">
                        {viewMode === "grid" ? (
                            <FileGridView
                                files={filteredFiles}
                                onDelete={handleDelete}
                                onOpen={handleOpen}
                                onDownload={handleDownload}
                                onShare={handleShare}
                                onRename={handleRename}
                                onToggleStar={handleToggleStar}
                                onSummarize={handleSummarizePDF}
                            />
                        ) : (
                            <FileListView
                                files={filteredFiles}
                                onDelete={handleDelete}
                                onOpen={handleOpen}
                                onDownload={handleDownload}
                                onShare={handleShare}
                                onRename={handleRename}
                                onToggleStar={handleToggleStar}
                                onSummarize={handleSummarizePDF}
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
            {showSummaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg">
                        <h3 className="mb-4 text-lg font-semibold">PDF Summary</h3>

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
        </div>
    );
}
