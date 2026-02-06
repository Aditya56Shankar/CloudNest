import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Logo from "/KitaabKosh_logo.svg";
import { useAuth } from "../../components/auth-context";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/80 shadow-sm border-b">
      <nav className="py-3">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src={Logo}
              className="h-11 w-auto transition-transform hover:scale-105"
              alt="KitaabKosh Logo"
            />
          </Link>

          {/* Mobile Toggle */}
          <button
            type="button"
            className="ml-auto inline-flex items-center rounded-xl p-2 text-sm text-[#042546] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#98793E]/40 lg:hidden transition"
            aria-controls="navbar"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>

          {/* Menu */}
          <div
            className={`${
              isMenuOpen ? "block animate-fadeIn" : "hidden"
            } w-full lg:order-1 lg:flex lg:w-auto`}
            id="navbar"
          >
            <ul className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-white p-4 shadow-md lg:mt-0 lg:flex-row lg:gap-8 lg:bg-transparent lg:p-0 lg:shadow-none">
              {[
                { to: "/dashboard", label: "Home" },
                { to: "/about", label: "About" },
                { to: "/contact", label: "Contact Us" },
              ].map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `relative px-3 py-2 text-sm font-medium transition
                       ${
                         isActive
                           ? "text-[#98793E]"
                           : "text-[#042546] hover:text-[#745c30]"
                       }
                       after:absolute after:-bottom-1 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:bg-[#98793E] after:transition-all after:duration-300
                       ${isActive ? "after:w-6" : "hover:after:w-6"}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}

              {user ? (
                <>
                  <li>
                    <span className="rounded-full bg-[#98793E]/10 px-4 py-1.5 text-sm text-[#042546]">
                      👋 {user.name}
                    </span>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl bg-gradient-to-r from-[#98793E] to-[#745c30] px-5 py-2 text-sm font-medium text-white shadow hover:shadow-lg transition active:scale-95"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/"
                    className="rounded-xl bg-gradient-to-r from-[#98793E] to-[#745c30] px-5 py-2 text-sm font-medium text-white shadow hover:shadow-lg transition active:scale-95"
                  >
                    Log in
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
