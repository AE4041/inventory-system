import { ApiError } from "../utils/apiError.js";

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
  }

  if (err?.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: err.issues?.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  // Prisma known error codes
  if (err?.code === "P2002") {
    return res.status(409).json({ success: false, message: `Duplicate value for: ${err.meta?.target}` });
  }
  if (err?.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found" });
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
}
