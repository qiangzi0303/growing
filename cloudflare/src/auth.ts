const encoder = new TextEncoder();
const iterations = 100_000;
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
function bytes(value: string) {
  if (!/^(?:[a-f0-9]{2})+$/i.test(value)) throw Error("Invalid hex");
  return Uint8Array.from(value.match(/../g)!, v => parseInt(v, 16));
}
export function random(size: number) { return hex(crypto.getRandomValues(new Uint8Array(size))); }
export async function hash(value: string) { return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))); }
async function derive(password: string, salt: Uint8Array, rounds: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations: rounds, salt }, key, 256));
}
export async function passwordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iterations}$${hex(salt)}$${hex(await derive(password, salt, iterations))}`;
}
export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256" || parts[1] !== String(iterations)) return false;
  try {
    const salt = bytes(parts[2]), expected = bytes(parts[3]);
    if (salt.length !== 16 || expected.length !== 32) return false;
    const actual = await derive(password, salt, iterations);
    let difference = 0;
    for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
    return difference === 0;
  } catch { return false; }
}
export const cookieName = "growing.session";
export function sessionToken(request: Request) {
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return request.headers.get("Cookie")?.split(";").map(s => s.trim()).find(s => s.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
}
export function sessionCookie(token: string, request: Request, expires?: string) {
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax${new URL(request.url).protocol === "https:" ? "; Secure" : ""}${expires ? "; Expires=" + new Date(expires).toUTCString() : "; Max-Age=0"}`;
}
