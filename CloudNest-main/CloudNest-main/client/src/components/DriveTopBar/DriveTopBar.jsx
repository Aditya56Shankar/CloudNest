import { Grid, HelpCircle, List, Search, Settings } from "lucide-react";
import { useState } from "react";

export default function DriveTopBar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  storageUsed = 0,
  storageTotal = 15360,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <div className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition" />
            <input
              type="text"
              placeholder="Search in Drive"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-full border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">

          {/* View Toggle */}
          <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-inner">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`rounded-lg p-2 transition ${
                viewMode === "grid"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:bg-white"
              }`}
              title="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`rounded-lg p-2 transition ${
                viewMode === "list"
                  ? "bg-white shadow text-blue-600"
                  : "text-gray-500 hover:bg-white"
              }`}
              title="List view"
            >
              <List size={20} />
            </button>
          </div>

          {/* Storage Indicator */}
          <div className="relative group">
            <div className="h-2.5 w-28 rounded-full bg-gray-200 overflow-hidden cursor-help">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block rounded-md bg-gray-900 text-white text-xs py-1.5 px-3 shadow-lg">
              {storageUsed.toFixed(1)}MB of {storageTotal}MB
            </div>
          </div>

          {/* Settings */}
          <button className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600">
            <Settings size={20} />
          </button>

          {/* Help */}
          <button className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-blue-600">
            <HelpCircle size={20} />
          </button>

          {/* Profile */}
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md transition hover:scale-105 hover:shadow-lg ring-2 ring-blue-200"
            title="Profile"
          >
            U
          </button>
        </div>
      </div>
    </div>
  );
}
