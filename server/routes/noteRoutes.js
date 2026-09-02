const express = require("express");

const verifyToken = require("../middleware/verifyToken");
const checkNoteOwnership = require("../middleware/checkNoteOwnership");
const handleValidation = require("../middleware/handleValidation");

const {
  objectIdValidator,
  createNoteValidator,
  updateNoteValidator,
} = require("../validators/noteValidator");

const {
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
} = require("../controllers/noteController");
const router = express.Router();

router.use(verifyToken);

// Active notes
router.get("/", getAllNotes);

// Archive
router.get("/archive", getArchivedNotes);

// Trash
router.get("/trash", getTrashNotes);

// Get single note
router.get(
  "/:id",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  getNoteById,
);

// Create
router.post(
  "/",
  createNoteValidator,
  handleValidation,
  createNote,
);

// Update
router.put(
  "/:id",
  updateNoteValidator,
  handleValidation,
  checkNoteOwnership,
  updateNote,
);

// Pin / unpin
router.patch(
  "/:id/pin",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  togglePin,
);

// Archive
router.patch(
  "/:id/archive",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  archiveNote,
);

// Unarchive
router.patch(
  "/:id/unarchive",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  unarchiveNote,
);

// Move to trash
router.patch(
  "/:id/trash",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  moveToTrash,
);

// Restore from trash
router.patch(
  "/:id/restore",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  restoreNote,
);

// Permanently delete
router.delete(
  "/:id/permanent",
  objectIdValidator,
  handleValidation,
  checkNoteOwnership,
  permanentlyDeleteNote,
);

module.exports = router;