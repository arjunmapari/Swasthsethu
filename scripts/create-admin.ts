// Creates (or resets) the first admin account. Run once after setting DATABASE_URL:
//   npm run create-admin -- you@clinic.org "a-strong-password" "Dr. Name"
// or with env vars:  ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… npm run create-admin
import { closePool, query } from "../src/server/db";
import { checkPasswordStrength, hashPassword } from "../src/server/password";
import { EMAIL_RE, EmailTakenError, createUser, findUserByEmail, normalizeEmail } from "../src/server/users";

const [argEmail, argPassword, argName] = process.argv.slice(2);
const email = argEmail ?? process.env.ADMIN_EMAIL ?? "";
const password = argPassword ?? process.env.ADMIN_PASSWORD ?? "";
const name = argName ?? process.env.ADMIN_NAME ?? "Admin";

async function main() {
  if (!EMAIL_RE.test(email)) throw new Error("Give a valid email: npm run create-admin -- you@clinic.org \"password\" \"Name\"");
  const weak = checkPasswordStrength(password);
  if (weak) throw new Error(weak);

  const existing = await findUserByEmail(email);
  if (existing) {
    await query("UPDATE users SET role = 'admin', active = true, password_hash = $2, session_version = session_version + 1 WHERE id = $1", [existing.id, await hashPassword(password)]);
    console.log(`Updated ${normalizeEmail(email)}: now an active admin with the new password.`);
  } else {
    try {
      await createUser({ email, name, password, role: "admin" });
      console.log(`Created admin ${normalizeEmail(email)}.`);
    } catch (err) {
      if (err instanceof EmailTakenError) throw new Error("That email is already registered.");
      throw err;
    }
  }
}

main()
  .catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => closePool());
