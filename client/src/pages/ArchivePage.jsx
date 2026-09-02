import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import useNotes from "../hooks/useNotes";
import Spinner from "../components/Spinner";
import NoteCard from "../components/NoteCard";
import NoteViewModal from "../components/NoteViewModal";
import NoteModal from "../components/NoteModal";
import SearchBar from "../components/SearchBar";

const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return doc.body.textContent || "";
};

const ArchivePage = () => {
  const {
    archivedNotes,
    archiveLoading,
    fetchArchivedNotes,
    unarchiveNote,
    deleteNote,
    updateNote,
  } = useNotes();

  const [viewingNote, setViewingNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [restoring, setRestoring] = useState(null);

  // Search / filter / sort
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    fetchArchivedNotes();
  }, [fetchArchivedNotes]);

  // Get all unique tags from archived notes
  const allTags = useMemo(() => {
    return [
      ...new Set(
        archivedNotes.flatMap((note) => note.tags || []),
      ),
    ].sort();
  }, [archivedNotes]);

  // Filter and sort archived notes
  const filteredArchivedNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = archivedNotes.filter((note) => {
      const title = note.title?.toLowerCase() || "";
      const content = stripHtml(note.content).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        content.includes(query) ||
        note.tags?.some((tag) =>
          tag.toLowerCase().includes(query),
        );

      const matchesTag =
        !selectedTag || note.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return (
            new Date(a.createdAt) -
            new Date(b.createdAt)
          );

        case "updated":
          return (
            new Date(b.updatedAt) -
            new Date(a.updatedAt)
          );

        case "title-asc":
          return (a.title || "").localeCompare(
            b.title || "",
          );

        case "title-desc":
          return (b.title || "").localeCompare(
            a.title || "",
          );

        case "largest":
          return (
            stripHtml(b.content).length -
            stripHtml(a.content).length
          );

        case "smallest":
          return (
            stripHtml(a.content).length -
            stripHtml(b.content).length
          );

        case "newest":
        default:
          return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
          );
      }
    });
  }, [
    archivedNotes,
    searchQuery,
    selectedTag,
    sortOption,
  ]);

  // Unarchive
  const handleUnarchive = async (noteId) => {
    try {
      setRestoring(noteId);

      await unarchiveNote(noteId);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to unarchive note",
      );
    } finally {
      setRestoring(null);
    }
  };

  // Move to trash
  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to move note to trash",
      );
    }
  };

  // Edit archived note
  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  // Save edited archived note
  const handleSave = async ({
    title,
    content,
    color,
    tags,
  }) => {
    try {
      await updateNote(editingNote._id, {
        title,
        content,
        color,
        tags,
      });

      setModalOpen(false);
      setEditingNote(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update note",
      );
    }
  };

  if (archiveLoading) {
    return <Spinner size="lg" />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1120] dark:text-slate-100">
          Archive
        </h1>

      </div>

      {/* Search / Filter / Sort */}
      {archivedNotes.length > 0 && (
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />

          {/* Tag filter */}
          <select
            value={selectedTag}
            onChange={(e) =>
              setSelectedTag(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-400 focus:ring-1 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500"
          >
            <option value="">All Tags</option>

            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortOption}
            onChange={(e) =>
              setSortOption(e.target.value)
            }
            className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-400 focus:ring-1 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500"
          >
            <option value="newest">
              Newest first
            </option>

            <option value="oldest">
              Oldest first
            </option>

            <option value="updated">
              Recently updated
            </option>

            <option value="title-asc">
              Title A–Z
            </option>

            <option value="title-desc">
              Title Z–A
            </option>

            <option value="largest">
              Largest
            </option>

            <option value="smallest">
              Smallest
            </option>
          </select>
        </div>
      )}

      {/* Empty / Filtered Archive */}
      {filteredArchivedNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-5">
            <ArchiveEmptyIcon />
          </div>

          <h2 className="text-lg font-semibold text-gray-700">
            {archivedNotes.length === 0
              ? "Archive is empty"
              : "No archived notes found"}
          </h2>

          <p className="mt-1 max-w-xs text-sm text-gray-500">
            {archivedNotes.length === 0
              ? "Notes you archive will appear here."
              : "Try a different search term or clear your filters."}
          </p>
        </div>
      ) : (
        <>
          {/* Results heading */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Archived Notes
            </h2>
          </div>

          {/* Archived notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredArchivedNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onView={setViewingNote}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePin={() => {}}
                onArchive={() => {}}
                onUnarchive={handleUnarchive}
                isArchivedPage={true}
                isSelected={false}
                onSelect={() => {}}
                selectionMode={false}
                unarchiving={restoring === note._id}
              />
            ))}
          </div>
        </>
      )}

      {/* View modal */}
      <NoteViewModal
        isOpen={Boolean(viewingNote)}
        onClose={() => setViewingNote(null)}
        note={viewingNote}
      />

      {/* Edit modal */}
      <NoteModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingNote(null);
        }}
        note={editingNote}
        onSave={handleSave}
      />
    </main>
  );
};

/* ── Empty archive icon ── */

const ArchiveEmptyIcon = () => (
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
    <path d="M4 7h16" />
    <path d="M6 7v12h12V7" />
    <path d="M4 7l1-4h14l1 4" />
    <path d="M9 11h6" />
    <path d="M9 15h4" />
  </svg>
);

export default ArchivePage;
