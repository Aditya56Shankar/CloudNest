/* eslint-disable react/prop-types */
import { useState } from "react";

function Card({
  id,
  title,
  author,
  description,
  isPublic,
  createdAt,
  fileUrl,
  fileName,
  onEdit,
  onDelete,
  view,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit({ id, title, author, description, isPublic });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
    setIsModalOpen(false);
  };

  const handleDownload = () => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const formattedDate = new Date(createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {view === "list" ? (
        <tr className="border-b hover:bg-gray-50 transition">
          <td className="px-6 py-3 font-medium text-gray-800">{title}</td>
          <td className="px-6 py-3 text-gray-600">{author}</td>
          <td className="px-6 py-3 text-gray-600 line-clamp-2">{description}</td>
          <td className="px-6 py-3">
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isPublic ? "Public" : "Private"}
            </span>
          </td>
          <td className="px-6 py-3 text-gray-500">{formattedDate}</td>
          <td className="px-6 py-3">
            <div className="flex flex-wrap gap-2">
              {fileUrl && (
                <button
                  className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 text-white shadow hover:shadow-lg transition active:scale-95"
                  onClick={handleDownload}
                >
                  Download
                </button>
              )}
              <button
                onClick={handleEdit}
                className="rounded-lg bg-gradient-to-r from-[#98793E] to-[#745c30] px-3 py-1.5 text-white shadow hover:shadow-lg transition active:scale-95"
              >
                Edit
              </button>
              <button
                onClick={openModal}
                className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-3 py-1.5 text-white shadow hover:shadow-lg transition active:scale-95"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      ) : (
        <div className="group h-min w-72 rounded-2xl bg-white/80 backdrop-blur border border-gray-200 p-5 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
          <h2 className="mb-2 text-lg font-bold text-gray-800 group-hover:text-[#98793E] transition">
            {title}
          </h2>

          <p className="mb-1 text-sm text-gray-600">
            <span className="font-semibold">Author:</span> {author}
          </p>

          <p className="mb-1 text-sm text-gray-600">
            <span className="font-semibold">Description:</span>{" "}
            <span className="line-clamp-2">{description}</span>
          </p>

          {fileName && (
            <p className="mb-1 text-sm text-gray-600">
              <span className="font-semibold">File:</span>{" "}
              <span className="line-clamp-1">{fileName}</span>
            </p>
          )}

          <p className="mb-1 text-sm text-gray-600">
            <span className="font-semibold">Visibility:</span>{" "}
            <span
              className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                isPublic
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {isPublic ? "Public" : "Private"}
            </span>
          </p>

          <p className="mb-4 text-xs text-gray-500">
            Added on: {formattedDate}
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {fileUrl && (
                <button
                  className="flex-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1.5 text-white shadow hover:shadow-lg transition active:scale-95"
                  onClick={handleDownload}
                >
                  Download
                </button>
              )}
              <button
                className="flex-1 rounded-lg bg-gradient-to-r from-[#98793E] to-[#745c30] px-3 py-1.5 text-white shadow hover:shadow-lg transition active:scale-95"
                onClick={handleEdit}
              >
                Edit
              </button>
              <button
                className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-3 py-1.5 text-white shadow hover:shadow-lg transition active:scale-95"
                onClick={openModal}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scaleIn">
            <h2 className="mb-2 text-lg font-bold text-gray-800">
              Confirm Delete
            </h2>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-4 py-2 text-sm text-white shadow hover:shadow-lg transition active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Card;
