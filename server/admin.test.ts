import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import bcrypt from "bcryptjs";

describe("Admin User Management", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user for admin operations
    const testUser = {
      openId: `test-admin-${Date.now()}`,
      name: "Test Admin User",
      email: `admin-test-${Date.now()}@test.com`,
      role: "staff" as const,
      passwordHash: await bcrypt.hash("testpassword", 10),
    };
    await db.upsertUser(testUser);
    const user = await db.getUserByEmailWithPassword(testUser.email!);
    testUserId = user!.id;
  });

  it("should update user permissions", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Update permissions
    await database
      .update(users)
      .set({ permissions: ["view_finance", "manage_users"] })
      .where(eq(users.id, testUserId));

    // Verify update
    const updatedUser = await database
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(updatedUser[0].permissions).toEqual(["view_finance", "manage_users"]);
  });

  it("should update user role", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Update role to manager
    await database.update(users).set({ role: "manager" }).where(eq(users.id, testUserId));

    // Verify update
    const updatedUser = await database
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(updatedUser[0].role).toBe("manager");
  });

  it("should update user status", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Suspend user
    await database.update(users).set({ status: "suspended" }).where(eq(users.id, testUserId));

    // Verify update
    const updatedUser = await database
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(updatedUser[0].status).toBe("suspended");

    // Reactivate user
    await database.update(users).set({ status: "active" }).where(eq(users.id, testUserId));

    const reactivatedUser = await database
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(reactivatedUser[0].status).toBe("active");
  });

  it("should reset user password", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const newPassword = "YuLian888!";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Reset password
    await database
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, testUserId));

    // Verify password was updated
    const updatedUser = await database
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    const isValid = await bcrypt.compare(newPassword, updatedUser[0].passwordHash!);
    expect(isValid).toBe(true);
  });

  it("should list all users", async () => {
    const database = await db.getDb();
    if (!database) throw new Error("Database not available");

    const { users } = await import("../drizzle/schema");

    const allUsers = await database.select().from(users);
    expect(allUsers.length).toBeGreaterThan(0);
    expect(allUsers.some((u) => u.id === testUserId)).toBe(true);
  });
});
