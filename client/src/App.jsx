import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";

import { useAuth } from "./context/useAuth";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import TrashPage from "./pages/TrashPage";
import ArchivePage from "./pages/ArchivePage";
import ProfilePage from "./pages/ProfilePage";

import socket from "./api/socket";

function App() {
  const { token } = useAuth();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot-password" ||
    location.pathname.startsWith("/reset-password");

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  // ─────────────────────────────────────────────
  // Socket.IO authentication + connection
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      // No authenticated user, so make sure
      // the socket is disconnected.
      if (socket.connected) {
        socket.disconnect();
      }

      return;
    }

    // Give Socket.IO the current user's token.
    socket.auth = {
      token,
    };

    // Connect using the current user's token.
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Do not disconnect here.
      //
      // The effect can re-run for reasons unrelated
      // to authentication. The socket should remain
      // connected while the user is logged in.
    };
  }, [token]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontSize: "14px" },
        }}
      />

      {!isAuthPage && token && (
        <>
          {/* Desktop / tablet sidebar */}
          <div className="hidden md:block">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() =>
                setSidebarCollapsed((prev) => !prev)
              }
            />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="fixed top-3 left-4 z-40 flex h-10 w-10 cursor-pointer items-center justify-center bg-white text-gray-700 hover:bg-gray-50 md:hidden dark:bg-[#0B1120] dark:border-[#0B1120] dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Open navigation menu"
            title="Open menu"
          >
            <MenuIcon />
          </button>

          {/* Mobile sidebar */}
          {mobileSidebarOpen && (
            <>
              <button
                type="button"
                onClick={closeMobileSidebar}
                className="fixed inset-0 z-40 bg-black/20 md:hidden"
                aria-label="Close navigation menu"
              />

              <div className="fixed inset-y-0 left-0 z-50 md:hidden">
                <Sidebar
                  collapsed={false}
                  onToggle={closeMobileSidebar}
                />
              </div>
            </>
          )}
        </>
      )}

      <div
        className={
          !isAuthPage && token
            ? `min-h-screen bg-white transition-[margin] duration-200 dark:bg-[#0B1120] ${
                sidebarCollapsed
                  ? "md:ml-16"
                  : "md:ml-64"
              }`
            : "min-h-screen"
        }
      >
        {!isAuthPage && token && <Navbar />}

        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage />
              )
            }
          />

          <Route
            path="/register"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <RegisterPage />
              )
            }
          />

          <Route
            path="/forgot-password"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <ForgotPasswordPage />
              )
            }
          />

          <Route
            path="/reset-password/:token"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <ResetPasswordPage />
              )
            }
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </>
  );
}

const MenuIcon = () => (
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
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

export default App;
