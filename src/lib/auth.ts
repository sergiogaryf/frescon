import { randomBytes, pbkdf2Sync } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = "sha512";

/** Genera hash seguro con salt: "salt:hash" */
export function hashPassword(password: string): string {
  const salt = randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifica password contra hash almacenado */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return candidate === hash;
}

/** Genera token aleatorio para sesiones y reset */
export function generateToken(): string {
  return randomBytes(48).toString("hex");
}

/** Cookie name para sesion de cliente */
export const SESSION_COOKIE = "frescon_session";
