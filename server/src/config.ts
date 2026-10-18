// Must be the FIRST import of every entry point: it loads server/.env before any
// other module reads process.env.
import dotenv from 'dotenv';

dotenv.config();

const MIN_JWT_SECRET_LENGTH = 32;
// Values that were published in earlier versions of this repo and must never be used.
const REJECTED_JWT_SECRETS = new Set([
  'bookleaf_super_secret_jwt_key_2026_dev',
  'change_me',
  'changeme'
]);

/** Returns the JWT secret or throws with setup instructions. Used for signing and verification alike. */
function loadJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH || REJECTED_JWT_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      `JWT_SECRET is missing, too short (min ${MIN_JWT_SECRET_LENGTH} chars) or a known placeholder. ` +
        `Set it in server/.env. Generate one with:\n` +
        `  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
    );
  }
  return secret;
}

export const JWT_SECRET = loadJwtSecret();
