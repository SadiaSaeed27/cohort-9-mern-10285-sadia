import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import socket from "../api/socket";

const sortNotes = (notes) =>
  [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

const sortArchivedNotes = (notes) =>
  [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [trashNotes, setTrashNotes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);

  // Fetch active notes
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await axiosInstance.get("/notes");

      setNotes(data.notes);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch archived notes
  const fetchArchivedNotes = useCallback(async () => {
    try {
      setArchiveLoading(true);

      const { data } = await axiosInstance.get("/notes/archive");

      setArchivedNotes(data.notes);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch archive");
    } finally {
      setArchiveLoading(false);
    }
  }, []);

  // Fetch trashed notes
  const fetchTrashNotes = useCallback(async () => {
    try {
      setTrashLoading(true);

      const { data } = await axiosInstance.get("/notes/trash");

      setTrashNotes(data.notes);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch trash");
    } finally {
      setTrashLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Socket.IO real-time updates
  useEffect(() => {
    // Note created
    const handleNoteCreated = (createdNote) => {
      setNotes((prev) => {
        const exists = prev.some((note) => note._id === createdNote._id);

        if (exists) {
          return sortNotes(
            prev.map((note) =>
              note._id === createdNote._id ? createdNote : note,
            ),
          );
        }

        return sortNotes([createdNote, ...prev]);
      });
    };

    // Note updated
    // Handles:
    // - normal update
    // - pin/unpin
    // - archive/unarchive
    // - move to trash
    // - restore
    const handleNoteUpdated = (updatedNote) => {
      // Trashed note
      if (updatedNote.isTrashed) {
        setNotes((prev) => prev.filter((note) => note._id !== updatedNote._id));

        setArchivedNotes((prev) =>
          prev.filter((note) => note._id !== updatedNote._id),
        );

        setTrashNotes((prev) => {
          const exists = prev.some((note) => note._id === updatedNote._id);

          if (exists) {
            return prev.map((note) =>
              note._id === updatedNote._id ? updatedNote : note,
            );
          }

          return [updatedNote, ...prev];
        });

        return;
      }

      // Archived note
      if (updatedNote.isArchived) {
        setNotes((prev) => prev.filter((note) => note._id !== updatedNote._id));

        setTrashNotes((prev) =>
          prev.filter((note) => note._id !== updatedNote._id),
        );

        setArchivedNotes((prev) => {
          const exists = prev.some((note) => note._id === updatedNote._id);

          if (exists) {
            return sortArchivedNotes(
              prev.map((note) =>
                note._id === updatedNote._id ? updatedNote : note,
              ),
            );
          }

          return sortArchivedNotes([updatedNote, ...prev]);
        });

        return;
      }

      // Active note
      setArchivedNotes((prev) =>
        prev.filter((note) => note._id !== updatedNote._id),
      );

      setTrashNotes((prev) =>
        prev.filter((note) => note._id !== updatedNote._id),
      );

      setNotes((prev) => {
        const exists = prev.some((note) => note._id === updatedNote._id);

        if (exists) {
          return sortNotes(
            prev.map((note) =>
              note._id === updatedNote._id ? updatedNote : note,
            ),
          );
        }

        return sortNotes([updatedNote, ...prev]);
      });
    };

    // Note permanently deleted
    const handleNoteDeleted = ({ noteId }) => {
      setNotes((prev) => prev.filter((note) => note._id !== noteId));

      setArchivedNotes((prev) => prev.filter((note) => note._id !== noteId));

      setTrashNotes((prev) => prev.filter((note) => note._id !== noteId));
    };

    socket.on("note:created", handleNoteCreated);
    socket.on("note:updated", handleNoteUpdated);
    socket.on("note:deleted", handleNoteDeleted);

    // Cleanup listeners when the hook unmounts.
    return () => {
      socket.off("note:created", handleNoteCreated);
      socket.off("note:updated", handleNoteUpdated);
      socket.off("note:deleted", handleNoteDeleted);
    };
  }, []);

  // Create note
  const createNote = useCallback(async ({ title, content, color, tags }) => {
    const { data } = await axiosInstance.post("/notes", {
      title,
      content,
      color,
      tags,
    });

    setNotes((prev) => {
      const exists = prev.some((note) => note._id === data.note._id);

      if (exists) {
        return sortNotes(
          prev.map((note) => (note._id === data.note._id ? data.note : note)),
        );
      }

      return sortNotes([data.note, ...prev]);
    });

    toast.success("Note created");
  }, []);

  // Update note
  const updateNote = useCallback(
    async (noteId, { title, content, color, tags }) => {
      const { data } = await axiosInstance.put(`/notes/${noteId}`, {
        title,
        content,
        color,
        tags,
      });

      const updatedNote = data.note;

      if (!updatedNote.isArchived && !updatedNote.isTrashed) {
        setNotes((prev) =>
          sortNotes(
            prev.map((note) => (note._id === noteId ? updatedNote : note)),
          ),
        );
      }

      if (updatedNote.isArchived && !updatedNote.isTrashed) {
        setArchivedNotes((prev) =>
          sortArchivedNotes(
            prev.map((note) => (note._id === noteId ? updatedNote : note)),
          ),
        );
      }

      toast.success("Note updated");
    },
    [],
  );

  // Archive note
  const archiveNote = useCallback(async (noteId) => {
    const { data } = await axiosInstance.patch(`/notes/${noteId}/archive`);

    setNotes((prev) => prev.filter((note) => note._id !== noteId));

    setArchivedNotes((prev) => sortArchivedNotes([data.note, ...prev]));

    toast.success("Note archived");
  }, []);

  // Unarchive note
  const unarchiveNote = useCallback(async (noteId) => {
    const { data } = await axiosInstance.patch(`/notes/${noteId}/unarchive`);

    setArchivedNotes((prev) => prev.filter((note) => note._id !== noteId));

    setNotes((prev) => sortNotes([data.note, ...prev]));

    toast.success("Note unarchived");
  }, []);

  // Move note to trash
  const deleteNote = useCallback(async (noteId) => {
    const { data } = await axiosInstance.patch(`/notes/${noteId}/trash`);

    setNotes((prev) => prev.filter((note) => note._id !== noteId));

    setArchivedNotes((prev) => prev.filter((note) => note._id !== noteId));

    setTrashNotes((prev) => {
      const exists = prev.some((note) => note._id === noteId);

      if (exists) {
        return prev.map((note) => (note._id === noteId ? data.note : note));
      }

      return [data.note, ...prev];
    });

    toast.success("Note moved to trash");
  }, []);

  // Restore note from trash
  const restoreNote = useCallback(async (noteId) => {
    const { data } = await axiosInstance.patch(`/notes/${noteId}/restore`);

    setTrashNotes((prev) => prev.filter((note) => note._id !== noteId));

    setNotes((prev) =>
      sortNotes([data.note, ...prev.filter((note) => note._id !== noteId)]),
    );

    toast.success("Note restored");
  }, []);

  // Permanently delete note
  const permanentlyDeleteNote = useCallback(async (noteId) => {
    await axiosInstance.delete(`/notes/${noteId}/permanent`);

    setTrashNotes((prev) => prev.filter((note) => note._id !== noteId));

    toast.success("Note permanently deleted");
  }, []);

  // Toggle pin
  const togglePin = useCallback(async (noteId) => {
    const { data } = await axiosInstance.patch(`/notes/${noteId}/pin`);

    setNotes((prev) =>
      sortNotes(prev.map((note) => (note._id === noteId ? data.note : note))),
    );

    toast.success(data.note.isPinned ? "Note pinned" : "Note unpinned");
  }, []);

  return {
    notes,
    archivedNotes,
    trashNotes,

    loading,
    archiveLoading,
    trashLoading,

    createNote,
    updateNote,

    archiveNote,
    unarchiveNote,

    deleteNote,
    restoreNote,
    permanentlyDeleteNote,

    togglePin,

    fetchArchivedNotes,
    fetchTrashNotes,
  };
};

export default useNotes;
