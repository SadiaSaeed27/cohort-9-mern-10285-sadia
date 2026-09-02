const Note = require("../models/Note");
const sanitizeContent = require("../utils/sanitizeContent");

// @desc    Get all active notes for authenticated user
// @route   GET /api/notes
const getAllNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({
      userId: req.user.userId,
      isTrashed: false,
      isArchived: false,
    }).sort({
      isPinned: -1,
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all archived notes for authenticated user
// @route   GET /api/notes/archive
const getArchivedNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({
      userId: req.user.userId,
      isTrashed: false,
      isArchived: true,
    }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all trashed notes for authenticated user
// @route   GET /api/notes/trash
const getTrashNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({
      userId: req.user.userId,
      isTrashed: true,
    }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive a note
// @route   PATCH /api/notes/:id/archive
const archiveNote = async (req, res, next) => {
  try {
    const { note } = req;

    if (note.isTrashed) {
      return res.status(400).json({
        success: false,
        message: "Trashed notes cannot be archived",
      });
    }

    note.isArchived = true;

    // Archived notes should no longer remain pinned
    note.isPinned = false;

    const archivedNote = await note.save();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:updated",
      archivedNote,
    );

    res.status(200).json({
      success: true,
      message: "Note archived",
      note: archivedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unarchive a note
// @route   PATCH /api/notes/:id/unarchive
const unarchiveNote = async (req, res, next) => {
  try {
    const { note } = req;

    if (note.isTrashed) {
      return res.status(400).json({
        success: false,
        message: "Trashed notes cannot be unarchived",
      });
    }

    note.isArchived = false;

    const unarchivedNote = await note.save();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:updated",
      unarchivedNote,
    );

    res.status(200).json({
      success: true,
      message: "Note unarchived",
      note: unarchivedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Move note to trash
// @route   PATCH /api/notes/:id/trash
const moveToTrash = async (req, res, next) => {
  try {
    const { note } = req;

    note.isTrashed = true;

    // A trashed note should no longer remain pinned or archived
    note.isPinned = false;
    note.isArchived = false;

    const updatedNote = await note.save();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:updated",
      updatedNote,
    );

    res.status(200).json({
      success: true,
      message: "Note moved to trash",
      note: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore note from trash
// @route   PATCH /api/notes/:id/restore
const restoreNote = async (req, res, next) => {
  try {
    const { note } = req;

    note.isTrashed = false;
    note.isArchived = false;

    const restoredNote = await note.save();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:updated",
      restoredNote,
    );

    res.status(200).json({
      success: true,
      message: "Note restored",
      note: restoredNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single note by ID
// @route   GET /api/notes/:id
const getNoteById = async (req, res) => {
  res.status(200).json({
    success: true,
    note: req.note,
  });
};

// @desc    Create a new note
// @route   POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const { title, content, color, tags } = req.body;

    const note = await Note.create({
      title,
      content: sanitizeContent(content),
      color,
      tags,
      userId: req.user.userId,
    });

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:created",
      note,
    );

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an existing note
// @route   PUT /api/notes/:id
const updateNote = async (req, res, next) => {
  try {
    const { note } = req;
    const { title, content, color, tags } = req.body;

    note.title = title ?? note.title;

    note.content =
      content !== undefined
        ? sanitizeContent(content)
        : note.content;

    note.color = color ?? note.color;

    if (tags !== undefined) {
      note.tags = tags;
    }

    const updatedNote = await note.save();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:updated",
      updatedNote,
    );

    res.status(200).json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle pin status of a note
// @route   PATCH /api/notes/:id/pin
const togglePin = async (req, res, next) => {
  try {
    const { note } = req;

    if (note.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Archived notes cannot be pinned",
      });
    }

    if (note.isTrashed) {
      return res.status(400).json({
        success: false,
        message: "Trashed notes cannot be pinned",
      });
    }

    note.isPinned = !note.isPinned;

    const updatedNote = await note.save();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:updated",
      updatedNote,
    );

    res.status(200).json({
      success: true,
      note: updatedNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete a note
// @route   DELETE /api/notes/:id/permanent
const permanentlyDeleteNote = async (req, res, next) => {
  try {
    const { note } = req;

    if (!note.isTrashed) {
      return res.status(400).json({
        success: false,
        message: "Only trashed notes can be permanently deleted",
      });
    }

    const noteId = note._id;

    await note.deleteOne();

    const io = req.app.get("io");

    io.to(`user:${req.user.userId}`).emit(
      "note:deleted",
      { noteId },
    );

    res.status(200).json({
      success: true,
      message: "Note permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotes,
  getArchivedNotes,
  getTrashNotes,
  getNoteById,
  createNote,
  updateNote,
  togglePin,
  archiveNote,
  unarchiveNote,
  moveToTrash,
  restoreNote,
  permanentlyDeleteNote,
};
