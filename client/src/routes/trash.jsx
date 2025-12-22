import React from "react";
import { Trash2, RotateCcw } from "lucide-react";

export default function Trash({
  files = [],
  onRestore,
  onPermanentDelete
}) {
  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Trash</h1>
        <p className="text-sm text-gray-500">
          Items in trash will be permanently deleted after 30 days
        </p>
      </div>

      {/* Empty State */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <Trash2 size={56} className="text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-700">
            Trash is empty
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Files you delete will appear here
          </p>
        </div>
      ) : (
        /* Trash Items */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file._id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              {/* File Info */}
              <div className="mb-3">
                <h3 className="font-medium text-gray-900 truncate">
                  {file.title}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {file.author}
                </p>
                {file.deletedAt && (
                  <p className="text-xs text-red-500 mt-1">
                    Deleted on{" "}
                    {new Date(file.deletedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => onRestore(file._id)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <RotateCcw size={16} />
                  Restore
                </button>

                <button
                  onClick={() => onPermanentDelete(file._id)}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} />
                  Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
