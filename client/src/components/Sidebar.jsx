import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const navItems = [
    {
      to: "/",
      label: "All Notes",
      icon: <NotesIcon />,
    },
    {
      to: "/archive",
      label: "Archive",
      icon: <ArchiveIcon />,
    },
    {
      to: "/trash",
      label: "Trash",
      icon: <TrashIcon />,
    },
  ];

  return (
    <aside
      className={`group fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white   dark:border-slate-800 dark:bg-[#0B1120] ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div
        className={`flex h-16 items-center border-b border-gray-200 dark:border-slate-800 ${
          collapsed ? "justify-center" : "justify-between px-4"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#0B1120] dark:text-white">
  <LightBulbIcon />
</div>

          {!collapsed && (
            <span className="truncate text-lg font-bold tracking-tight text-[#0B1120] dark:text-slate-100">
             10P Notes
            </span>
          )}
        </div>

        {/* Collapse button */}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="cursor-pointer rounded-md p-1.5 text-[#0B1120] transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Collapsed hover expand button */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 cursor-pointer rounded-full border border-gray-200 bg-white p-1.5 text-[#0B1120] shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 group-hover:flex"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2 py-4" aria-label="Sidebar navigation">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
  `flex h-11 items-center rounded-lg text-sm font-medium  ${
    collapsed
      ? "justify-center"
      : "gap-3 px-3"
  } ${
    isActive
      ? "bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
  }`
              }
              title={collapsed ? item.label : undefined}
            >
              {item.icon}

              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 px-2 py-3 dark:border-slate-800">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
  `flex h-11 items-center rounded-lg text-sm font-medium transition-colors ${
    collapsed
      ? "justify-center"
      : "gap-3 px-3"
  } ${
    isActive
      ? "bg-gray-100 text-[#0B1120] dark:bg-slate-800 dark:text-slate-100"
      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
  }`
}
          title={collapsed ? "Profile" : undefined}
        >
          <ProfileIcon />
          {!collapsed && <span>Profile</span>}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className={`mt-1 flex h-11 w-full cursor-pointer items-center rounded-lg text-sm font-medium text-[#0B1120] transition-colors hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
            collapsed
              ? "justify-center"
              : "gap-3 px-3"
          }`}
          title={collapsed ? "Logout" : undefined}
          aria-label="Log out"
        >
          <LogoutIcon />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

/* ── Icons ── */

const LightBulbIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.7-1.5 1.6-1.5 2.5h-4c0-.9-.7-1.8-1.5-2.5Z" />
    <path d="M12 2v1" />
    <path d="m4.93 4.93.7.7" />
    <path d="M2 12h1" />
    <path d="m19.07 4.93-.7.7" />
    <path d="M22 12h-1" />
  </svg>
);

const NotesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </svg>
);

const ArchiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Archive box */}
    <path d="M4 7h16v13H4z" />

    {/* Top lid */}
    <path d="M3 4h18v3H3z" />

    {/* Down arrow */}
    <path d="M12 10v6" />
    <path d="m9 13 3 3 3-3" />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 2 2 2v2" />
  </svg>
);

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default Sidebar;

