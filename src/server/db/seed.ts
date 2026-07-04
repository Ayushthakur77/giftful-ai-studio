/**
 * One-shot seed. Run:  bun run db:seed
 *
 * Reads SUPER_ADMIN_EMAIL + SUPER_ADMIN_PASSWORD from env, scrypt-hashes,
 * and upserts the single permanent super_admin. Idempotent.
 */
import { authService } from "../services/auth.service";

async function main() {
  const { email } = await authService.ensureSuperAdmin();
  console.log(`✔ super_admin ensured for ${email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
