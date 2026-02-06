import { Clock, Home, LogOut, Star, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth-context";

export default function DriveSidebar({
  currentFolder,
  onFolderClick,
  storageUsed = 0,
  storageTotal = 15360,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const storagePercentage =
    storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-white/80 backdrop-blur flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow">
            C
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            CloudNest
          </h1>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <NavItem
          icon={<Home size={18} />}
          label="My Files"
          active={currentFolder === "my-files"}
          onClick={() => onFolderClick("my-files")}
        />
        <NavItem
          icon={<Clock size={18} />}
          label="Recent"
          active={currentFolder === "recent"}
          onClick={() => onFolderClick("recent")}
        />
        <NavItem
          icon={<Star size={18} />}
          label="Starred"
          active={currentFolder === "starred"}
          onClick={() => onFolderClick("starred")}
        />
        <NavItem
          icon={<Trash2 size={18} />}
          label="Trash"
          active={currentFolder === "trash"}
          onClick={() => onFolderClick("trash")}
        />
      </nav>

      {/* Storage */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-3 rounded-xl bg-gray-50 p-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-gray-700">Storage</span>
            <span className="text-gray-500">
              {storageUsed.toFixed(2)}MB of {storageTotal}MB
            </span>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
        </div>
        <button className="text-blue-600 text-xs hover:underline font-semibold w-full text-left">
          + Get more storage
        </button>
      </div>

      {/* User Footer */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-3 rounded-xl bg-gray-50 p-3">
          {user && (
            <>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition active:scale-[0.98]"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all
        ${
          active
            ? "bg-blue-50 text-blue-600 shadow-inner"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        }`}
    >
      {/* Active Indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-blue-500" />
      )}

      <span className="transition group-hover:scale-110">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
