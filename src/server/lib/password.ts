import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Password hashing via scrypt (standard Node crypto — Worker-compatible
 * with nodejs_compat; portable to any Node host). Format:
 *   scrypt$N=16384,r=8,p=1$<salt-hex>$<hash-hex>
 */
const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password.normalize("NFKC"), salt, KEY_LEN, { N, r: R, p: P });
  return `scrypt$N=${N},r=${R},p=${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [algo, _params, saltHex, hashHex] = stored.split("$");
    if (algo !== "scrypt") return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(password.normalize("NFKC"), salt, expected.length, { N, r: R, p: P });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
