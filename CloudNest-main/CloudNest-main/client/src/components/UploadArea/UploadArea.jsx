import { Upload} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { createBook } from "../../lib/queries";

export default function UploadArea({ onFileUpload, isUploading }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    for (let file of files) {
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    for (let file of files) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    try {
      const formData = new FormData();
      formData.append("title", file.name);
      formData.append("author", "You");
      formData.append("description", `Uploaded on ${new Date().toLocaleDateString()}`);
      formData.append("file", file);

      const result = await createBook(formData);
      onFileUpload(result);
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${file.name}`);
      console.error(error);
    }
  };

  return (
    <>
      {/* Upload Button in Top Action Bar */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        <Upload size={18} />
        {isUploading ? "Uploading..." : "Upload Files"}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="fixed inset-0 bg-blue-500 bg-opacity-10 border-4 border-dashed border-blue-500 flex items-center justify-center z-50 pointer-events-none"
        >
          <div className="text-center">
            <Upload size={64} className="mx-auto mb-4 text-blue-600" />
            <p className="text-xl font-bold text-blue-600">Drop files here to upload</p>
          </div>
        </div>
      )}
    </>
  );
}
