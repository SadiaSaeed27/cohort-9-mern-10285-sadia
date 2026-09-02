import { useEffect, useCallback, useRef } from "react";

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

const NoteViewModal = ({ isOpen, onClose, note }) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (
        !e.shiftKey &&
        document.activeElement === lastElement
      ) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;

      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        const firstFocusable =
          dialogRef.current?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );

        firstFocusable?.focus();
      });
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !note) return null;

  const bgColor = COLOR_MAP[note.color] || COLOR_MAP.yellow;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="View note"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5"
          style={{ backgroundColor: bgColor }}
        >
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-semibold text-gray-900">
              {note.title}
            </h2>

            {note.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
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
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-1 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-800"
            aria-label="Close note"
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Note content */}
        <div className="note-content min-h-0 overflow-y-auto overflow-x-hidden px-6 py-6">
          {note.content ? (
            <div
              className="min-w-0 max-w-full break-words text-sm leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <p className="text-sm italic text-gray-500">
              This note is empty.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <time
            className="text-xs text-gray-500"
            dateTime={note.createdAt}
          >
            Created {getRelativeTime(note.createdAt)}
          </time>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CloseIcon = () => (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default NoteViewModal;