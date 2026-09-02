const request = require("supertest");
const { expect } = require("chai");

process.env.JWT_SECRET = "test-jwt-secret-for-testing";
process.env.NODE_ENV = "test";

const app = require("../app");

const {
  createTestUser,
  generateTestToken,
  createTestNote,
} = require("./helpers");

require("./setup");

let user;
let token;

beforeEach(async () => {
  user = await createTestUser();
  token = generateTestToken(user._id);
});

/* =========================
   GET ACTIVE NOTES
========================= */

describe("GET /api/notes", () => {
  it("should return empty array when no notes exist", async () => {
    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.notes).to.have.lengthOf(0);
    expect(res.body.count).to.equal(0);
  });

  it("should return user notes sorted by pin then date", async () => {
    await createTestNote(user._id, { title: "Note 1" });

    await createTestNote(user._id, {
      title: "Note 2",
      isPinned: true,
    });

    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.have.lengthOf(2);
    expect(res.body.notes[0].title).to.equal("Note 2");
    expect(res.body.notes[0].isPinned).to.equal(true);
  });

  it("should not return other users notes", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    await createTestNote(otherUser._id, {
      title: "Other User Note",
    });

    await createTestNote(user._id, {
      title: "My Note",
    });

    const res = await request(app)
      .get("/api/notes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.have.lengthOf(1);
    expect(res.body.notes[0].title).to.equal("My Note");
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/notes");

    expect(res.status).to.equal(401);
  });
});


/* =========================
   GET ARCHIVED NOTES
========================= */

describe("GET /api/notes/archive", () => {
  it("should return archived notes only", async () => {
    await createTestNote(user._id, {
      title: "Archived Note",
      isArchived: true,
    });

    await createTestNote(user._id, {
      title: "Active Note",
    });

    const res = await request(app)
      .get("/api/notes/archive")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.notes).to.have.lengthOf(1);
    expect(res.body.notes[0].title).to.equal("Archived Note");
    expect(res.body.notes[0].isArchived).to.equal(true);
  });

  it("should not return other users archived notes", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    await createTestNote(otherUser._id, {
      title: "Other Archived Note",
      isArchived: true,
    });

    const res = await request(app)
      .get("/api/notes/archive")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.have.lengthOf(0);
  });
});


/* =========================
   GET TRASH NOTES
========================= */

describe("GET /api/notes/trash", () => {
  it("should return trashed notes only", async () => {
    await createTestNote(user._id, {
      title: "Trashed Note",
      isTrashed: true,
    });

    await createTestNote(user._id, {
      title: "Active Note",
    });

    const res = await request(app)
      .get("/api/notes/trash")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.notes).to.have.lengthOf(1);
    expect(res.body.notes[0].title).to.equal("Trashed Note");
    expect(res.body.notes[0].isTrashed).to.equal(true);
  });

  it("should not return other users trashed notes", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    await createTestNote(otherUser._id, {
      title: "Other Trashed Note",
      isTrashed: true,
    });

    const res = await request(app)
      .get("/api/notes/trash")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.notes).to.have.lengthOf(0);
  });
});


/* =========================
   GET SINGLE NOTE
========================= */

describe("GET /api/notes/:id", () => {
  it("should return a single note", async () => {
    const note = await createTestNote(user._id, {
      title: "Single Note",
    });

    const res = await request(app)
      .get(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.note.title).to.equal("Single Note");
  });

  it("should return 403 when accessing another user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const note = await createTestNote(otherUser._id);

    const res = await request(app)
      .get(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });

  it("should return 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .get("/api/notes/invalid-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
  });
});


/* =========================
   CREATE NOTE
========================= */

describe("POST /api/notes", () => {
  it("should create a new note", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "New Note",
        content: "<p>Hello</p>",
        color: "blue",
      });

    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.note.title).to.equal("New Note");
    expect(res.body.note.color).to.equal("blue");
    expect(res.body.note.userId).to.equal(user._id.toString());
  });

  it("should use default color when not specified", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Default Color Note",
      });

    expect(res.status).to.equal(201);
    expect(res.body.note.color).to.equal("yellow");
  });

  it("should return 400 if title is missing", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        content: "No title",
      });

    expect(res.status).to.equal(400);
  });

  it("should return 400 for invalid color", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test",
        color: "rainbow",
      });

    expect(res.status).to.equal(400);
  });

  it("should strip unsafe HTML from content (XSS protection)", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "XSS Test",
        content:
          '<p>Safe <strong>text</strong></p><script>alert("xss")</script>',
      });

    expect(res.status).to.equal(201);
    expect(res.body.note.content).to.not.contain("<script>");
    expect(res.body.note.content).to.contain("<strong>text</strong>");
  });
});


/* =========================
   UPDATE NOTE
========================= */

describe("PUT /api/notes/:id", () => {
  it("should update an existing note", async () => {
    const note = await createTestNote(user._id);

    const res = await request(app)
      .put(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Title",
        color: "green",
      });

    expect(res.status).to.equal(200);
    expect(res.body.note.title).to.equal("Updated Title");
    expect(res.body.note.color).to.equal("green");
  });

  it("should return 403 when updating other user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const otherNote = await createTestNote(otherUser._id);

    const res = await request(app)
      .put(`/api/notes/${otherNote._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Hacked",
      });

    expect(res.status).to.equal(403);
  });

  it("should return 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .put("/api/notes/invalid-id")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test",
      });

    expect(res.status).to.equal(400);
  });
});


/* =========================
   PIN / UNPIN
========================= */

describe("PATCH /api/notes/:id/pin", () => {
  it("should toggle pin status", async () => {
    const note = await createTestNote(user._id, {
      isPinned: false,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/pin`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.note.isPinned).to.equal(true);

    const res2 = await request(app)
      .patch(`/api/notes/${note._id}/pin`)
      .set("Authorization", `Bearer ${token}`);

    expect(res2.status).to.equal(200);
    expect(res2.body.note.isPinned).to.equal(false);
  });

  it("should return 400 when pinning an archived note", async () => {
    const note = await createTestNote(user._id, {
      isArchived: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/pin`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      "Archived notes cannot be pinned",
    );
  });

  it("should return 400 when pinning a trashed note", async () => {
    const note = await createTestNote(user._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/pin`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      "Trashed notes cannot be pinned",
    );
  });
});


/* =========================
   ARCHIVE
========================= */

describe("PATCH /api/notes/:id/archive", () => {
  it("should archive a note", async () => {
    const note = await createTestNote(user._id);

    const res = await request(app)
      .patch(`/api/notes/${note._id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.note.isArchived).to.equal(true);
    expect(res.body.note.isPinned).to.equal(false);
  });

  it("should unpin a note when archiving it", async () => {
    const note = await createTestNote(user._id, {
      isPinned: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.note.isArchived).to.equal(true);
    expect(res.body.note.isPinned).to.equal(false);
  });

  it("should return 400 when archiving a trashed note", async () => {
    const note = await createTestNote(user._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      "Trashed notes cannot be archived",
    );
  });

  it("should return 403 when archiving another user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const note = await createTestNote(otherUser._id);

    const res = await request(app)
      .patch(`/api/notes/${note._id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});


/* =========================
   UNARCHIVE
========================= */

describe("PATCH /api/notes/:id/unarchive", () => {
  it("should unarchive a note", async () => {
    const note = await createTestNote(user._id, {
      isArchived: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/unarchive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.note.isArchived).to.equal(false);
  });

  it("should return 400 when unarchiving a trashed note", async () => {
    const note = await createTestNote(user._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/unarchive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      "Trashed notes cannot be unarchived",
    );
  });

  it("should return 403 when unarchiving another user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const note = await createTestNote(otherUser._id, {
      isArchived: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/unarchive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});


/* =========================
   MOVE TO TRASH
========================= */

describe("PATCH /api/notes/:id/trash", () => {
  it("should move a note to trash", async () => {
    const note = await createTestNote(user._id);

    const res = await request(app)
      .patch(`/api/notes/${note._id}/trash`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.note.isTrashed).to.equal(true);
    expect(res.body.note.isArchived).to.equal(false);
    expect(res.body.note.isPinned).to.equal(false);
  });

  it("should remove pinned and archived status when moving to trash", async () => {
    const note = await createTestNote(user._id, {
      isPinned: true,
      isArchived: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/trash`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.note.isTrashed).to.equal(true);
    expect(res.body.note.isPinned).to.equal(false);
    expect(res.body.note.isArchived).to.equal(false);
  });

  it("should return 403 when trashing another user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const note = await createTestNote(otherUser._id);

    const res = await request(app)
      .patch(`/api/notes/${note._id}/trash`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});


/* =========================
   RESTORE
========================= */

describe("PATCH /api/notes/:id/restore", () => {
  it("should restore a trashed note", async () => {
    const note = await createTestNote(user._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/restore`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.note.isTrashed).to.equal(false);
    expect(res.body.note.isArchived).to.equal(false);
  });

  it("should return 403 when restoring another user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const note = await createTestNote(otherUser._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .patch(`/api/notes/${note._id}/restore`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});


/* =========================
   PERMANENT DELETE
========================= */

describe("DELETE /api/notes/:id/permanent", () => {
  it("should permanently delete a trashed note", async () => {
    const note = await createTestNote(user._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .delete(`/api/notes/${note._id}/permanent`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.message).to.equal("Note permanently deleted");

    const checkRes = await request(app)
      .get(`/api/notes/${note._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(checkRes.status).to.equal(404);
  });

  it("should return 400 when permanently deleting an active note", async () => {
    const note = await createTestNote(user._id);

    const res = await request(app)
      .delete(`/api/notes/${note._id}/permanent`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(400);
    expect(res.body.message).to.equal(
      "Only trashed notes can be permanently deleted",
    );
  });

  it("should return 403 when permanently deleting another user's note", async () => {
    const otherUser = await createTestUser({
      email: "other@example.com",
    });

    const note = await createTestNote(otherUser._id, {
      isTrashed: true,
    });

    const res = await request(app)
      .delete(`/api/notes/${note._id}/permanent`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
  });
});