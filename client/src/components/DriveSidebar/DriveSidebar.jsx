import {Home, Clock, Star, Trash2, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../auth-context";

export default function DriveSidebar({ currentFolder, onFolderClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center text-white font-bold">
            C
          </div>
          <h1 className="text-xl font-bold text-gray-900">CloudNest</h1>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavItem
          icon={<Home size={20} />}
          label="My Files"
          active={currentFolder === "my-files"}
          onClick={() => onFolderClick("my-files")}
        />
        <NavItem
          icon={<Clock size={20} />}
          label="Recent"
          active={currentFolder === "recent"}
          onClick={() => onFolderClick("recent")}
        />
        <NavItem
          icon={<Star size={20} />}
          label="Starred"
          active={currentFolder === "starred"}
          onClick={() => onFolderClick("starred")}
        />
        <NavItem
          icon={<Trash2 size={20} />}
          label="Trash"
          active={currentFolder === "trash"}
          onClick={() => onFolderClick("trash")}
        />
      </nav>

      {/* Storage */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">Storage</span>
            <span className="text-gray-500 text-xs">2.5GB of 15GB</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-1/6 bg-blue-500 rounded-full" />
          </div>
        </div>
        <button className="text-blue-600 text-sm hover:underline font-medium w-full text-left">
          Get more storage
        </button>
      </div>

      {/* User Footer */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="text-sm text-gray-600 mb-3">
          {user && (
            <>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm font-medium"
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-gray-700 hover:bg-gray-100 text-gray-600"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
