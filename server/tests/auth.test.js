require("./setup");

const request = require("supertest");
const { expect } = require("chai");

process.env.JWT_SECRET = "test-jwt-secret-for-testing";
process.env.NODE_ENV = "test";

const app = require("../app");
const { createTestUser } = require("./helpers");


describe("POST /api/auth/register", () => {
  it("should register a new user and return token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });

    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.token).to.exist;
    expect(res.body.user.name).to.equal("John Doe");
    expect(res.body.user.email).to.equal("john@example.com");
    expect(res.body.user.password).to.be.undefined;
  });

  it("should return 409 if email already exists", async () => {
    await createTestUser({ email: "existing@example.com" });

    const res = await request(app).post("/api/auth/register").send({
      name: "Another User",
      email: "existing@example.com",
      password: "password123",
    });

    expect(res.status).to.equal(409);
    expect(res.body.success).to.equal(false);
  });

  it("should return 400 if name is missing", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.errors).to.exist;
  });

  it("should return 400 if password is too short", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test",
      email: "test@example.com",
      password: "123",
    });

    expect(res.status).to.equal(400);
    expect(res.body.errors).to.exist;
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await createTestUser({
      email: "login@example.com",
    });
  });

  it("should login with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.token).to.exist;
    expect(res.body.user.email).to.equal("login@example.com");
  });

  it("should return 401 with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "wrongpassword",
    });

    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.equal("Invalid credentials");
  });

  it("should return 401 with non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@example.com",
      password: "password123",
    });

    expect(res.status).to.equal(401);
    expect(res.body.success).to.equal(false);
  });

  it("should return 400 if email is empty", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "",
      password: "password123",
    });

    expect(res.status).to.equal(400);
    expect(res.body.errors).to.exist;
  });
});