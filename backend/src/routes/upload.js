import express from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

import { uploadsDir } from "../lib/storage.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = express.Router();

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ORIGINAL_FILENAME_LENGTH = 120;

const ALLOWED_FILE_TYPES = new Map([
  ["application/pdf", [".pdf"]],
  [
    "application/msword",
    [".doc"],
  ],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    [".docx"],
  ],
  [
    "application/vnd.ms-excel",
    [".xls"],
  ],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    [".xlsx"],
  ],
  ["text/csv", [".csv"]],
  ["text/plain", [".txt"]],
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
]);

function createSafeFilename(file) {
  const originalExtension = path.extname(file.originalname).toLowerCase();

  /*
   * `randomUUID()` prevents collisions and avoids exposing the original
   * filename in the server's physical storage path. The database/UI can
   * keep showing `file.originalname` to users.
   */
  return `${crypto.randomUUID()}${originalExtension}`;
}

function validateFileType(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ALLOWED_FILE_TYPES.get(file.mimetype);

  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    throw new ApiError(
      400,
      "Unsupported file type. Upload a PDF, Office document, spreadsheet, CSV, text file, JPG, PNG, or WEBP image.",
    );
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    callback(null, createSafeFilename(file));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
    fields: 5,
    parts: 6,
    fieldNameSize: 100,
    fieldSize: 10 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    try {
      validateFileType(file);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  },
});

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          next(
            new ApiError(
              400,
              "File is too large. The maximum allowed upload size is 10 MB.",
            ),
          );
          return;
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          next(new ApiError(400, "Upload one file at a time."));
          return;
        }

        if (error.code === "LIMIT_PART_COUNT") {
          next(new ApiError(400, "Upload request contains too many parts."));
          return;
        }

        next(new ApiError(400, "The upload request is invalid."));
        return;
      }

      next(error);
      return;
    }

    try {
      if (!req.file) {
        throw new ApiError(400, "Choose a file to upload.");
      }

      const originalName = String(req.file.originalname ?? "").trim();

      if (!originalName) {
        throw new ApiError(400, "The uploaded file must have a filename.");
      }

      if (originalName.length > MAX_ORIGINAL_FILENAME_LENGTH) {
        throw new ApiError(
          400,
          `Filename must be ${MAX_ORIGINAL_FILENAME_LENGTH} characters or fewer.`,
        );
      }

      res.status(201).json({
        fileName: originalName,
        storedFileName: req.file.filename,
        fileUrl: `/uploads/${path.basename(req.file.filename)}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      next(error);
    }
  });
});

export default router;