import { getDatabase } from "./database.mjs";
import { AppError } from "./workspace/errors.mjs";
export async function consumeRate(key, maximum, windowMs, db = getDatabase()) {
  const now = Date.now();
  const { rows } = await db.query(
    `INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,$2)
    ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<=$3 THEN 1 ELSE rate_limits.count+1 END,
    expires_at=CASE WHEN rate_limits.expires_at<=$3 THEN EXCLUDED.expires_at ELSE rate_limits.expires_at END RETURNING count`,
    [key, now + windowMs, now],
  );
  if (rows[0].count > maximum)
    throw new AppError(429, "Trop de tentatives. Réessayez plus tard.");
}
