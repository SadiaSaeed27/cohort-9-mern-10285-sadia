import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/useAuth";

const getInitials = (name = "") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "?";

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
};

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    if (trimmedName.length > 50) {
      toast.error("Name cannot exceed 50 characters");
      return;
    }

    try {
      setSaving(true);

      const { data } = await axiosInstance.patch("/users/me", {
        name: trimmedName,
      });

      updateUser(data.user);

      setName(data.user.name);
      setEditing(false);

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1120]">
          Profile
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your account information.
        </p>
      </div>

      {/* Profile card */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Profile header */}
        <div className="flex flex-col items-center border-b border-gray-200 px-6 py-8 sm:flex-row sm:items-center sm:gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0B1120]  text-2xl font-semibold text-white">
            {getInitials(user.name)}
          </div>

          <div className="mt-4 text-center sm:mt-0 sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>

            <p className="mt-1 text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Account information */}
        <div className="px-6 py-6">
          {/* Name */}
          <div className="border-b border-gray-100 pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#0B1120]">Name</p>

                {!editing && (
                  <p className="mt-1 text-sm text-gray-500">{user.name}</p>
                )}
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setName(user.name);
                    setEditing(true);
                  }}
                  className="w-fit cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Edit
                </button>
              )}
            </div>

            {editing && (
              <form onSubmit={handleSave} className="mt-4">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={50}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-400"
                  aria-label="Name"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0B1120]  transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Email */}
          <div className="border-b border-gray-100 py-5">
            <p className="text-sm font-medium text-[#0B1120] ">Email</p>

            <p className="mt-1 break-all text-sm text-gray-500">{user.email}</p>

            <p className="mt-1 text-xs text-gray-400">
              Email address cannot currently be changed.
            </p>
          </div>

          {/* Account created */}
          {user.createdAt && (
            <div className="py-5">
              <p className="text-sm font-medium text-gray-700">Member since</p>

              <p className="mt-1 text-sm text-gray-500">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-5">
          <button
            type="button"
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      </section>
    </main>
  );
};

const LogoutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default ProfilePage;
