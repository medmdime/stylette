export function validateEmail(email: string) {
  // Simple email regex
  return /^\S+@\S+\.\S+$/.test(email);
}
