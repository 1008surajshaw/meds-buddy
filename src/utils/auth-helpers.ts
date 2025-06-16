import type { UserRole } from "@/types/type"

export const isValidUserRole = (role: string): role is UserRole => {
  return role === "patient" || role === "caretaker"
}

export const formatUserDisplayName = (name: string | null, email: string): string => {
  if (name && name.trim().length > 0) {
    return name.trim()
  }

  // Extract name from email if no name provided
  const emailPrefix = email.split("@")[0]
  // Take only the part before the first dot for cleaner names
  const cleanPrefix = emailPrefix.split(".")[0]
  return cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1)
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
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
