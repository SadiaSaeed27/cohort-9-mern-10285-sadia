import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import useNotes from "../hooks/useNotes";
import Spinner from "../components/Spinner";
import NoteViewModal from "../components/NoteViewModal";
import ConfirmDialog from "../components/ConfirmDialog";

const COLOR_MAP = {
  yellow: "#fff9c4",
  green: "#c8e6c9",
  blue: "#bbdefb",
  purple: "#e1bee7",
  pink: "#f8bbd0",
  red: "#ffcdd2",
  orange: "#ffe0b2",
};

const getRelativeTime = (dateString) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return `${months}mo ago`;
};

const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return doc.body.textContent || "";
};

const TrashPage = () => {
  const {
    trashNotes,
    trashLoading,
    fetchTrashNotes,
    restoreNote,
    permanentlyDeleteNote,
  } = useNotes();

  const [viewingNote, setViewingNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    fetchTrashNotes();
  }, [fetchTrashNotes]);

  const handleRestore = async (noteId) => {
    try {
      setRestoring(noteId);

      await restoreNote(noteId);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to restore note",
      );
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      await permanentlyDeleteNote(deleteTarget);

      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to permanently delete note",
      );
    } finally {
      setDeleting(false);
    }
  };

  if (trashLoading) {
    return <Spinner size="lg" />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1120]  dark:text-slate-100">
          Trash
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Notes moved to trash can be restored or permanently deleted.
        </p>
      </div>

      {/* Empty Trash */}
      {trashNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-5">
            <TrashEmptyIcon />
          </div>

          <h2 className="text-lg font-semibold text-gray-700">
            Trash is empty
          </h2>

          <p className="mt-1 max-w-xs text-sm text-gray-500">
            Notes you move to trash will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trashNotes.map((note) => {
            const bgColor =
              COLOR_MAP[note.color] || COLOR_MAP.yellow;

            const contentPreview = stripHtml(note.content).slice(
              0,
              150,
            );

            return (
              <article
                key={note._id}
                style={{ backgroundColor: bgColor }}
                className="group relative flex flex-col gap-3 rounded-xl border border-gray-200/60 p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 flex-1 text-base font-semibold text-gray-900">
                    {note.title}
                  </h3>
                </div>

                {/* Content */}
                {contentPreview && (
                  <p className="line-clamp-4 text-sm leading-relaxed text-gray-700">
                    {contentPreview}
                  </p>
                )}

                {/* Tags */}
                {note.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-black/5 px-2 py-1 text-xs text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <time
                    className="text-xs text-gray-500"
                    dateTime={note.updatedAt}
                  >
                    {getRelativeTime(note.updatedAt)}
                  </time>

                  <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                    {/* View */}
                    <button
                      onClick={() => setViewingNote(note)}
                      className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
                      aria-label="View note"
                      title="View"
                    >
                      <ViewIcon />
                    </button>

                    {/* Restore */}
                    <button
                      onClick={() => handleRestore(note._id)}
                      disabled={restoring === note._id}
                      className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Restore note"
                      title="Restore"
                    >
                      <RestoreIcon />
                    </button>

                    {/* Permanent delete */}
                    <button
                      onClick={() => setDeleteTarget(note._id)}
                      className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-red-600"
                      aria-label="Delete permanently"
                      title="Delete permanently"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* View note */}
      <NoteViewModal
        isOpen={Boolean(viewingNote)}
        onClose={() => setViewingNote(null)}
        note={viewingNote}
      />

      {/* Permanent delete confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Delete note permanently"
        message="This note will be permanently deleted and cannot be recovered. Are you sure?"
        loading={deleting}
      />
    </main>
  );
};

/* ── Icons ── */

const ViewIcon = () => (
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
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

const RestoreIcon = () => (
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
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v6h6" />
  </svg>
);

const DeleteIcon = () => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const TrashEmptyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-10 w-10 text-gray-400"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);

export default TrashPage;