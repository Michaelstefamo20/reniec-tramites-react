export const validPassword = (value) => typeof value === "string" && value.length >= 12 && value.length <= 128 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
export const validName = (value) => typeof value === "string" && value.trim().replace(/\s+/g, " ").length >= 4 && value.length <= 100 && !/[<>]/.test(value);
export const validDni = (value) => typeof value === "string" && /^\d{8}$/.test(value);
export const validEmail = (value) => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
export const normalizeName = (value) => value.trim().replace(/\s+/g, " ");
export const normalizeEmail = (value) => value.trim().toLowerCase();
