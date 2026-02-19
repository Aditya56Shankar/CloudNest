import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    deleteVersion,
    getVersionHistory,
    restoreVersion,
    uploadNewVersion,
} from "../../lib/queries";

import "./VersionHistory.css";

export default function VersionHistory({ file, onClose, onVersionChange }) {
    const [versions, setVersions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentVersion, setCurrentVersion] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComment, setUploadComment] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        loadVersionHistory();
    }, [file._id]);

    const loadVersionHistory = async () => {
        try {
            setIsLoading(true);
            const data = await getVersionHistory(file._id);
            setVersions(data.versions);
            setCurrentVersion(data.currentVersion);
        } catch (error) {
            toast.error("Failed to load version history");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check if it's a PDF
            if (file.type !== "application/pdf") {
                toast.error("Only PDF files are allowed");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadNewVersion = async () => {
        if (!selectedFile) {
            toast.error("Please select a file first");
            return;
        }

        try {
            setIsUploading(true);
            await uploadNewVersion(file._id, selectedFile, uploadComment);
            toast.success("New version uploaded successfully");
            setSelectedFile(null);
            setUploadComment("");
            await loadVersionHistory();
            if (onVersionChange) {
                onVersionChange();
            }
        } catch (error) {
            toast.error("Failed to upload new version");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRestore = async (versionNumber) => {
        if (!window.confirm(`Restore to version ${versionNumber}?`)) return;

        try {
            await restoreVersion(file._id, versionNumber);
            toast.success(`Restored to version ${versionNumber}`);
            await loadVersionHistory();
            if (onVersionChange) {
                onVersionChange();
            }
        } catch (error) {
            toast.error("Failed to restore version");
            console.error(error);
        }
    };

    const handleDelete = async (versionNumber) => {
        if (!window.confirm(`Delete version ${versionNumber}? This cannot be undone.`)) return;

        try {
            await deleteVersion(file._id, versionNumber);
            toast.success("Version deleted");
            await loadVersionHistory();
        } catch (error) {
            toast.error("Failed to delete version");
            console.error(error);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="version-history-overlay" onClick={onClose}>
            <div className="version-history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="version-history-header">
                    <h2>Version History</h2>
                    <button className="close-btn" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="version-history-body">
                    {/* File Info */}
                    <div className="file-info">
                        <h3>{file.title}</h3>
                        <p>Current Version: {currentVersion || 1}</p>
                    </div>

                    {/* Upload New Version */}
                    <div className="upload-version-section">
                        <h4>Upload New Version</h4>
                        <div className="upload-form">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />
                            {selectedFile && (
                                <div className="selected-file-info">
                                    <span>{selectedFile.name}</span>
                                    <span className="file-size">
                                        ({formatFileSize(selectedFile.size)})
                                    </span>
                                </div>
                            )}
                            <input
                                type="text"
                                placeholder="Comment (optional)"
                                value={uploadComment}
                                onChange={(e) => setUploadComment(e.target.value)}
                                disabled={isUploading}
                            />
                            <button
                                onClick={handleUploadNewVersion}
                                disabled={!selectedFile || isUploading}
                                className="btn-upload"
                            >
                                {isUploading ? "Uploading..." : "Upload New Version"}
                            </button>
                        </div>
                    </div>

                    {/* Version List */}
                    <div className="version-list">
                        <h4>Previous Versions</h4>
                        {isLoading ? (
                            <div className="loading">Loading versions...</div>
                        ) : versions.length === 0 ? (
                            <div className="no-versions">
                                No previous versions available. Upload a new version to start tracking.
                            </div>
                        ) : (
                            <div className="versions-container">
                                {versions.map((version) => (
                                    <div
                                        key={version._id}
                                        className={`version-item ${version.versionNumber === currentVersion ? "current" : ""
                                            }`}
                                    >
                                        <div className="version-info">
                                            <div className="version-header">
                                                <span className="version-number">
                                                    Version {version.versionNumber}
                                                    {version.versionNumber === currentVersion && (
                                                        <span className="badge-current">Current</span>
                                                    )}
                                                </span>
                                                <span className="version-date">
                                                    {formatDate(version.createdAt)}
                                                </span>
                                            </div>
                                            <div className="version-details">
                                                <p className="version-filename">{version.fileName}</p>
                                                <p className="version-size">
                                                    {formatFileSize(version.fileSize)}
                                                </p>
                                                {version.comment && (
                                                    <p className="version-comment">💬 {version.comment}</p>
                                                )}
                                                {version.uploadedBy && (
                                                    <p className="version-uploader">
                                                        👤 {version.uploadedBy.name || version.uploadedBy.email}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="version-actions">
                                            <button
                                                onClick={() => window.open(version.fileUrl, "_blank")}
                                                className="btn-view"
                                                title="View this version"
                                            >
                                                View
                                            </button>
                                            {version.versionNumber !== currentVersion && (
                                                <>
                                                    <button
                                                        onClick={() => handleRestore(version.versionNumber)}
                                                        className="btn-restore"
                                                        title="Restore this version"
                                                    >
                                                        Restore
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(version.versionNumber)}
                                                        className="btn-delete"
                                                        title="Delete this version"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
