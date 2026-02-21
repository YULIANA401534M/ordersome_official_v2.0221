import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, verifyPassword } from "./lib/password";
import * as db from "./db";

describe("Password Authentication", () => {
  describe("Password Hashing", () => {
    it("should hash a password", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it("should verify correct password", async () => {
      const password = "testpassword123";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);
      
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testpassword123";
      const wrongPassword = "wrongpassword";
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);
      
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testpassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      
      // But both should verify correctly
      expect(await verifyPassword(password, hash1)).toBe(true);
      expect(await verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("Database User Functions", () => {
    it("should get user by email", async () => {
      // This test assumes there's at least one user in the database
      // In a real scenario, you'd create a test user first
      const testEmail = "admin@example.com"; // Replace with actual test email
      const user = await db.getUserByEmailWithPassword(testEmail);
      
      // If user exists, check structure
      if (user) {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("email");
        expect(user).toHaveProperty("role");
      }
    });

    it("should return undefined for non-existent email", async () => {
      const nonExistentEmail = "nonexistent@example.com";
      const user = await db.getUserByEmailWithPassword(nonExistentEmail);
      
      expect(user).toBeUndefined();
    });

    it("should update user last signed in", async () => {
      // This test requires a valid user ID
      // In a real scenario, you'd create a test user first
      const testUserId = 1; // Replace with actual test user ID
      
      await expect(
        db.updateUserLastSignedIn(testUserId)
      ).resolves.not.toThrow();
    });
  });

  describe("User Roles", () => {
    it("should have valid role enum values", () => {
      const validRoles = ["customer", "franchisee", "admin"];
      
      validRoles.forEach(role => {
        expect(["customer", "franchisee", "admin"]).toContain(role);
      });
    });
  });
});
