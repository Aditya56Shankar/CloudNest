import { useState } from "react";
import { Search, Settings, HelpCircle, Grid, List } from "lucide-react";

export default function DriveTopBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  storageUsed = 2.5,
  storageTotal = 15,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search in Drive"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right: View modes, Storage, Settings, Profile */}
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex gap-1 rounded border border-gray-300 bg-gray-50 p-1">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`rounded p-2 ${viewMode === "grid" ? "bg-white shadow" : "text-gray-600"}`}
              title="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`rounded p-2 ${viewMode === "list" ? "bg-white shadow" : "text-gray-600"}`}
              title="List view"
            >
              <List size={20} />
            </button>
          </div>

          {/* Storage Indicator (Tooltip) */}
          <div className="relative group">
            <div className="h-6 w-24 rounded-full bg-gray-200 overflow-hidden cursor-help">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
              {storageUsed.toFixed(1)}GB of {storageTotal}GB
            </div>
          </div>

          {/* Settings */}
          <button className="rounded p-2 text-gray-600 hover:bg-gray-100" title="Settings">
            <Settings size={20} />
          </button>

          {/* Help */}
          <button className="rounded p-2 text-gray-600 hover:bg-gray-100" title="Help">
            <HelpCircle size={20} />
          </button>

          {/* Profile */}
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold hover:bg-blue-600"
            title="Profile"
          >
            U
          </button>
        </div>
      </div>
    </div>
  );
}
