/**
 * Shared client-side validation for auth forms.
 * Centralizes rules so Login, Register, and future forms stay consistent.
 */

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(email) {
  const trimmed = String(email ?? "").trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, message: "Email is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: "Enter a valid email address." };
  }

  return { valid: true, value: trimmed };
}

export function validatePassword(password, { isConfirm = false, confirmPassword = "" } = {}) {
  if (!password) {
    return { valid: false, message: "Password is required." };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    };
  }

  if (isConfirm && password !== confirmPassword) {
    return { valid: false, message: "Passwords do not match." };
  }

  return { valid: true };
}

export function validateCompanyName(name) {
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    return { valid: false, message: "Company name is required." };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: "Company name must be at least 2 characters." };
  }

  if (trimmed.length > 120) {
    return { valid: false, message: "Company name must be 120 characters or fewer." };
  }

  return { valid: true, value: trimmed };
}