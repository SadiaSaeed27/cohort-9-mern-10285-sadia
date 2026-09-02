import { useState } from "react";

import { marked } from "marked";

import TurndownService from "turndown";

import toast from "react-hot-toast";

import useNotes from "../hooks/useNotes";

import Spinner from "../components/Spinner";

import SearchBar from "../components/SearchBar";

import NoteList from "../components/NoteList";

import NoteModal from "../components/NoteModal";

import NoteViewModal from "../components/NoteViewModal";

const turndownService = new TurndownService();

const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html || "", "text/html");
  return doc.body.textContent || "";
};

const HomePage = () => {
  const {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    archiveNote,
    unarchiveNote,
  } = useNotes();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);

  const getTextLength = (html) => stripHtml(html).length;

  // ── Save note ──
  const handleSave = async ({ title, content, color, tags }) => {
    if (editingNote) {
      await updateNote(editingNote._id, {
        title,
        content,
        color,
        tags,
      });
    } else {
      await createNote({
        title,
        content,
        color,
        tags,
      });
    }
  };

  // ── Get all unique tags ──
  const allTags = [
    ...new Set(notes.flatMap((note) => note.tags || [])),
  ].sort();

  // ── Move note to trash ──
  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to move note to trash",
      );
    }
  };

  // ── Open create modal ──
  const openCreateModal = () => {
    setEditingNote(null);
    setModalOpen(true);
  };

  // ── Open edit modal ──
  const handleEdit = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };

  // ── Open view modal ──
  const handleView = (note) => {
    setViewingNote(note);
  };

  // ── Select / deselect note ──
  const handleSelectNote = (noteId) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId],
    );
  };

  // ── Exit selection mode ──
  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedNotes([]);
  };

  // ── Export selected notes as Markdown files ──
  const handleExport = () => {
    if (selectedNotes.length === 0) {
      toast.error("Please select at least one note");
      return;
    }

    const notesToExport = notes.filter((note) =>
      selectedNotes.includes(note._id),
    );

    notesToExport.forEach((note) => {
      const markdownContent = turndownService.turndown(
        note.content || "",
      );

      const markdown = `# ${note.title}

${markdownContent}
`;

      const blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;

      const safeFileName =
        note.title
          .replace(/[<>:"/\\|?*]/g, "_")
          .trim() || "note";

      link.download = `${safeFileName}.md`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    });

    toast.success(
      `${notesToExport.length} note${
        notesToExport.length > 1 ? "s" : ""
      } exported successfully`,
    );

    handleCancelSelection();
  };

  // ── Import Markdown files ──
  const handleImport = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    let importedCount = 0;

    try {
      for (const file of files) {
        if (!file.name.toLowerCase().endsWith(".md")) {
          continue;
        }

        const markdown = await file.text();
        const lines = markdown.split(/\r?\n/);

        let title = "";
        let contentMarkdown = markdown;

        // Look for first Markdown H1 as the title
        const titleIndex = lines.findIndex((line) =>
          /^#\s+/.test(line.trim()),
        );

        if (titleIndex !== -1) {
          title = lines[titleIndex]
            .replace(/^#\s+/, "")
            .trim();

          contentMarkdown = lines
            .slice(titleIndex + 1)
            .join("\n")
            .trim();
        }

        // If no H1 title exists, use filename
        if (!title) {
          title = file.name
            .replace(/\.md$/i, "")
            .trim();
        }

        // Convert Markdown to HTML
        const contentHtml = await marked.parse(contentMarkdown);

        await createNote({
          title,
          content: contentHtml,
          color: "yellow",
          tags: [],
        });

        importedCount++;
      }

      if (importedCount > 0) {
        toast.success(
          `${importedCount} note${
            importedCount > 1 ? "s" : ""
          } imported successfully`,
        );
      } else {
        toast.error("Please select Markdown (.md) files");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to import notes",
      );
    } finally {
      // Reset file input so the same file can be selected again
      event.target.value = "";
    }
  };

  // ── Filter and sort notes ──
  const filteredNotes = notes
    .filter((note) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        note.title.toLowerCase().includes(query) ||
        stripHtml(note.content).toLowerCase().includes(query) ||
        note.tags?.some((tag) =>
          tag.toLowerCase().includes(query),
        );

      const matchesTag =
        !selectedTag || note.tags?.includes(selectedTag);

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Pinned notes always stay at the top
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      switch (sortOption) {
        case "oldest":
          return (
            new Date(a.createdAt) - new Date(b.createdAt)
          );

        case "updated":
          return (
            new Date(b.updatedAt) - new Date(a.updatedAt)
          );

        case "title-asc":
          return a.title.localeCompare(b.title);

        case "title-desc":
          return b.title.localeCompare(a.title);

        case "largest":
          return (
            getTextLength(b.content) -
            getTextLength(a.content)
          );

        case "smallest":
          return (
            getTextLength(a.content) -
            getTextLength(b.content)
          );

        case "newest":
        default:
          return (
            new Date(b.createdAt) - new Date(a.createdAt)
          );
      }
    });

  // ── Split filtered notes into pinned and all notes ──
  const pinnedNotes = filteredNotes.filter(
    (note) => note.isPinned,
  );

  const allNotes = filteredNotes.filter(
    (note) => !note.isPinned,
  );

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8 text-gray-900 dark:text-slate-100">

      {/* ── Header ── */}
      <div className="mb-8">

        {/* Title + Export / Import */}
        <div className="mb-4 flex items-center justify-between gap-2">

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            My Notes
          </h1>

          <div className="flex items-center gap-2">

            {!selectionMode ? (
              <>
                {/* Export */}
                <button
                  type="button"
                  onClick={() => setSelectionMode(true)}
                  className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <span className="mr-1">↑</span>
                  Export
                </button>

                {/* Import */}
                <label className="cursor-pointer whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  <span className="mr-1">↓</span>
                  Import

                  <input
                    type="file"
                    accept=".md,text/markdown"
                    multiple
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </>
            ) : (
              <>
                {/* Export */}
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={selectedNotes.length === 0}
                  className="whitespace-nowrap rounded-lg bg-[#0B1120] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200"
                >
                  <span className="mr-1">↑</span>
                  Export
                  {selectedNotes.length > 0 &&
                    ` (${selectedNotes.length})`}
                </button>

                {/* Cancel */}
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">

          {/* Search */}
          <div className="w-full min-w-0 sm:flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {/* Tag + Sort */}
          <div className="flex w-full gap-3 sm:w-auto">

            {/* Tag filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-400 focus:ring-1 focus:ring-gray-400 sm:w-auto sm:flex-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500"
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
              onChange={(e) => setSortOption(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-700 outline-none transition-colors focus:border-gray-400 focus:ring-1 focus:ring-gray-400 sm:w-auto sm:flex-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="updated">Recently updated</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
            </select>

          </div>
        </div>
      </div>

      {/* ── Pinned Notes ── */}
      {pinnedNotes.length > 0 && (
        <section className="mb-10">

          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Pinned
            </h2>

            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              {pinnedNotes.length}
            </span>
          </div>

          <NoteList
            notes={pinnedNotes}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onTogglePin={togglePin}
            onArchive={archiveNote}
            onUnarchive={unarchiveNote}
            isSearching={searchQuery.length > 0}
            selectedNotes={selectedNotes}
            onSelect={handleSelectNote}
            selectionMode={selectionMode}
          />

        </section>
      )}

      {/* ── All Notes ── */}
      <section>

        {pinnedNotes.length > 0 && (
          <div className="mb-4 flex items-center gap-2">

            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              All Notes
            </h2>

            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400">
              {allNotes.length}
            </span>

          </div>
        )}

        <NoteList
          notes={allNotes}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePin={togglePin}
          onArchive={archiveNote}
          onUnarchive={unarchiveNote}
          isSearching={searchQuery.length > 0}
          selectedNotes={selectedNotes}
          onSelect={handleSelectNote}
          selectionMode={selectionMode}
        />

      </section>

      {/* ── Create note button ── */}
      <button
        type="button"
        onClick={openCreateModal}
        className="fixed right-6 bottom-6 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#0B1120] text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-gray-800 active:scale-95 dark:bg-white dark:text-black"
        aria-label="Create new note"
        title="New Note"
      >
        <PlusIcon />
      </button>

      {/* ── Note modal ── */}
      <NoteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        note={editingNote}
        onSave={handleSave}
      />

      {/* ── Note view modal ── */}
      <NoteViewModal
        isOpen={Boolean(viewingNote)}
        onClose={() => setViewingNote(null)}
        note={viewingNote}
      />

    </main>
  );
};

/* ── Create note icon ── */
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default HomePage;