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
  if (days < 30) return `${weeks}w ago`;
  return `${months}mo ago`;
};

const NoteCard = ({
  note,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  onArchive,
  onUnarchive,
  isArchivedPage = false,
  isSelected,
  onSelect,
  selectionMode,
  unarchiving = false,
}) => {
  const bgColor = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const contentPreview = note.content;

  return (
    <article
      style={{ backgroundColor: bgColor }}
      className={`group relative flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isSelected
          ? "border-gray-900 ring-2 ring-gray-900/20"
          : "border-gray-200/60"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {/* Selection checkbox */}
          {selectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(note._id)}
              className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-gray-900"
              aria-label={`Select ${note.title}`}
            />
          )}

          <h3 className="line-clamp-2 flex-1 text-base font-semibold text-gray-900">
            {note.title}
          </h3>
        </div>

        {/* Top-right action */}
        {isArchivedPage ? (
          <button
            type="button"
            onClick={() => onUnarchive(note._id)}
            disabled={unarchiving}
            className="shrink-0 cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Unarchive note"
            title="Unarchive"
          >
            <UnarchiveIcon />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onTogglePin(note._id)}
            className="shrink-0 cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
            title={note.isPinned ? "Unpin" : "Pin"}
          >
            <PinIcon filled={note.isPinned} />
          </button>
        )}
      </div>

      {/* Content preview */}
      {contentPreview && (
        <div
          className="note-preview line-clamp-4 text-sm leading-relaxed text-gray-700"
          dangerouslySetInnerHTML={{ __html: contentPreview }}
        />
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

        {/* Actions */}
        <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          {/* View */}
          <button
            type="button"
            onClick={() => onView(note)}
            className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
            aria-label="View note"
            title="View"
          >
            <ViewIcon />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
            aria-label="Edit note"
            title="Edit"
          >
            <EditIcon />
          </button>

          {/* Archive */}
          {!isArchivedPage && (
            <button
              type="button"
              onClick={() => onArchive(note._id)}
              className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
              aria-label="Archive note"
              title="Archive"
            >
              <ArchiveIcon />
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(note._id)}
            className="cursor-pointer rounded-md p-1.5 text-gray-500 transition-colors hover:bg-black/5 hover:text-red-600"
            aria-label="Delete note"
            title="Delete"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </article>
  );
};

/* ── Inline SVG Icons ── */

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

const PinIcon = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4.5 w-4.5"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 17v5" />
    <path d="M9 2h6l-1.5 5.5L16 12H8l2.5-4.5z" />
  </svg>
);

const EditIcon = () => (
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
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const ArchiveIcon = () => (
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
    {/* Archive box */}
    <path d="M4 7h16v13H4z" />

    {/* Top lid */}
    <path d="M3 4h18v3H3z" />

    {/* Down arrow */}
    <path d="M12 10v6" />
    <path d="m9 13 3 3 3-3" />
  </svg>
);

const UnarchiveIcon = () => (
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
    {/* Archive box */}
    <path d="M4 7h16v13H4z" />

    {/* Top lid */}
    <path d="M3 4h18v3H3z" />

    {/* Up arrow */}
    <path d="M12 17v-6" />
    <path d="m9 14 3-3 3 3" />
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
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 2 2 2v2" />
  </svg>
);

export default NoteCard;
