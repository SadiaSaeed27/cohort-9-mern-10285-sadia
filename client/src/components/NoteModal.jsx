import { useState, useEffect, useCallback, useRef } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import ColorPicker from "./ColorPicker";

const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "bold",
  "italic",
  "underline",
  "list",
  "link",
];

const NoteModal = ({ isOpen, onClose, note, onSave }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("yellow");
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [titleError, setTitleError] = useState(false);

  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  const isEditMode = Boolean(note);

  useEffect(() => {
    if (isOpen) {
      setTitle(note?.title || "");
      setContent(note?.content || "");
      setColor(note?.color || "yellow");
      setTags(note?.tags || []);
      setTagInput("");
      setTitleError(false);
    }
  }, [isOpen, note]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";

      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    };
  }, [isOpen, handleKeyDown]);

  const handleAddTag = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const newTag = tagInput.trim().toLowerCase();

    if (!newTag || tags.includes(newTag)) {
      setTagInput("");
      return;
    }

    setTags((prevTags) => [...prevTags, newTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags((prevTags) =>
      prevTags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitleError(true);
      return;
    }

    setSaving(true);

    try {
      await onSave({
        title: trimmedTitle,
        content,
        color,
        tags,
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? "Edit note" : "Create note"}
    >
      <form
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-white p-6 text-gray-900 shadow-xl dark:bg-slate-900 dark:text-slate-100"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {isEditMode ? "Edit Note" : "New Note"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Title input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);

              if (titleError) {
                setTitleError(false);
              }
            }}
            placeholder="Note title"
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-500 ${
              titleError
                ? "border-red-400 dark:border-red-500"
                : "border-gray-300 dark:border-slate-700"
            }`}
            autoFocus
          />

          {titleError && (
            <p className="mt-1 text-xs text-red-500">
              Title is required
            </p>
          )}
        </div>

        {/* Rich text editor */}
        <div className="note-editor">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Write your note…"
          />
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
            Color:
          </span>

          <ColorPicker
            selectedColor={color}
            onSelect={setColor}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-slate-300">
            Tags:
          </label>

          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-slate-800 dark:text-slate-200"
              >
                #{tag}

                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-100"
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-500"
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            {saving
              ? "Saving…"
              : isEditMode
                ? "Update"
                : "Create"}
          </button>
        </div>
      </form>
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

export default NoteModal;