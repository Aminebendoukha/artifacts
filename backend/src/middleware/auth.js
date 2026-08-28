// backend/src/middleware/auth.js
// Real JWT authentication middleware — replaces mockAuth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    "[auth] WARNING: JWT_SECRET is not set in backend/.env. Add JWT_SECRET=<a-long-random-string> before starting the server."
  );
}

/**
 * Verifies the `Authorization: Bearer <token>` header and attaches the
 * decoded payload to req.user as { userId, role, workspaceId, email }.
 * Mounted globally in app.js via `app.use(auth)` for every route declared
 * after it (orders, invoices, admin, activities, notifications, uploads).
 */
export function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      workspaceId: decoded.workspaceId,
      email: decoded.email,
    };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
}

/**
 * Optional role guard. Usage: router.get("/admin-only", requireRole("ADMIN"), handler)
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to access this resource." });
    }
    return next();
  };
}
