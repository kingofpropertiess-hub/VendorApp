/** Email + RFC-style validation, Indian phone, password rules — vendor forms. */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));
}

export function isValidPassword(password: string): boolean {
  return password.trim().length >= 6;
}
