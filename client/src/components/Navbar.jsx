import { useContext } from "react";
import ThemeContext from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";

const Navbar = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-slate-800 dark:bg-[#0B1120]">
      <h1 className="min-w-0 truncate pl-14 text-lg font-semibold text-gray-900 dark:text-white md:pl-0">
        Welcome, {user?.name || "User"}
      </h1>

      <button
        type="button"
        onClick={toggleTheme}
        className={`relative flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gray-700"
            : "bg-gray-200"
        }`}
        aria-label={
          theme === "light"
            ? "Switch to dark mode"
            : "Switch to light mode"
        }
        title={
          theme === "light"
            ? "Switch to dark mode"
            : "Switch to light mode"
        }
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
            theme === "dark"
              ? "translate-x-7"
              : "translate-x-0"
          }`}
        >
          {theme === "light" ? <SunIcon /> : <MoonIcon />}
        </span>
      </button>
    </header>
  );
};

/* ── Icons ── */

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m17.66 6.34 1.41-1.41" />
  </svg>
);

export default Navbar;