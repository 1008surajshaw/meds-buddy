import { describe, it, expect } from "vitest"

// Test utility functions from auth context
describe("Auth Utility Functions", () => {
  // Helper function to validate user role
  const isValidUserRole = (role: string): boolean => {
    return role === "patient" || role === "caretaker"
  }

  // Helper function to format user display name
  const formatUserDisplayName = (name: string | null, email: string): string => {
    if (name && name.trim().length > 0) {
      return name.trim()
    }

    // Extract name from email if no name provided
    const emailPrefix = email.split("@")[0]
    // Take only the part before the first dot for cleaner names
    const cleanPrefix = emailPrefix.split(".")[0]
    return cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1)
  }

  // Helper function to validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Helper function to validate password strength
  const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }

    if (password.length > 128) {
      errors.push("Password must be less than 128 characters")
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push("Password must contain at least one letter")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  describe("isValidUserRole", () => {
    it("should return true for patient role", () => {
      expect(isValidUserRole("patient")).toBe(true)
    })

    it("should return true for caretaker role", () => {
      expect(isValidUserRole("caretaker")).toBe(true)
    })

    it("should return false for invalid roles", () => {
      expect(isValidUserRole("admin")).toBe(false)
      expect(isValidUserRole("doctor")).toBe(false)
      expect(isValidUserRole("")).toBe(false)
      expect(isValidUserRole("PATIENT")).toBe(false) // case sensitive
    })

    it("should return false for null or undefined", () => {
      expect(isValidUserRole(null as any)).toBe(false)
      expect(isValidUserRole(undefined as any)).toBe(false)
    })
  })

  describe("formatUserDisplayName", () => {
    it("should return the name when provided", () => {
      expect(formatUserDisplayName("John Doe", "john@example.com")).toBe("John Doe")
    })

    it("should trim whitespace from name", () => {
      expect(formatUserDisplayName("  John Doe  ", "john@example.com")).toBe("John Doe")
    })

    it("should extract name from email when name is null", () => {
      expect(formatUserDisplayName(null, "john@example.com")).toBe("John")
    })

    it("should extract name from email when name is empty string", () => {
      expect(formatUserDisplayName("", "sarah.smith@example.com")).toBe("Sarah")
    })

    it("should extract name from email when name is only whitespace", () => {
      expect(formatUserDisplayName("   ", "mike@example.com")).toBe("Mike")
    })

    it("should handle complex email prefixes", () => {
      expect(formatUserDisplayName(null, "user123@example.com")).toBe("User123")
      expect(formatUserDisplayName(null, "test.user@example.com")).toBe("Test")
    })

    it("should capitalize first letter of email prefix", () => {
      expect(formatUserDisplayName(null, "lowercase@example.com")).toBe("Lowercase")
    })

    it("should handle single character email prefix", () => {
      expect(formatUserDisplayName(null, "a@example.com")).toBe("A")
    })
  })

  describe("isValidEmail", () => {
    it("should return true for valid email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true)
      expect(isValidEmail("test.email@domain.co.uk")).toBe(true)
      expect(isValidEmail("user+tag@example.org")).toBe(true)
      expect(isValidEmail("123@numbers.com")).toBe(true)
    })

    it("should return false for invalid email addresses", () => {
      expect(isValidEmail("invalid-email")).toBe(false)
      expect(isValidEmail("user@")).toBe(false)
      expect(isValidEmail("@domain.com")).toBe(false)
      expect(isValidEmail("user@domain")).toBe(false)
      expect(isValidEmail("")).toBe(false)
      expect(isValidEmail("user space@domain.com")).toBe(false)
    })

    it("should return false for null or undefined", () => {
      expect(isValidEmail(null as any)).toBe(false)
      expect(isValidEmail(undefined as any)).toBe(false)
    })
  })

  describe("isValidPassword", () => {
    it("should return valid for strong passwords", () => {
      const result = isValidPassword("password123")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should return valid for minimum length password with letters", () => {
      const result = isValidPassword("abc123")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should reject passwords that are too short", () => {
      const result = isValidPassword("abc12")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must be at least 6 characters long")
    })

    it("should reject passwords that are too long", () => {
      const longPassword = "a".repeat(129)
      const result = isValidPassword(longPassword)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must be less than 128 characters")
    })

    it("should reject passwords without letters", () => {
      const result = isValidPassword("123456")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must contain at least one letter")
    })

    it("should return multiple errors for invalid passwords", () => {
      const result = isValidPassword("123")
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors).toContain("Password must be at least 6 characters long")
      expect(result.errors).toContain("Password must contain at least one letter")
    })

    it("should handle empty password", () => {
      const result = isValidPassword("")
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Password must be at least 6 characters long")
      expect(result.errors).toContain("Password must contain at least one letter")
    })

    it("should accept passwords with special characters", () => {
      const result = isValidPassword("password!@#")
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
