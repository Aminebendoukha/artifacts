import express from "express";
import multer from "multer";
import path from "node:path";
import { uploadsDir } from "../lib/storage.js";
import { ApiError } from "../middleware/errorHandler.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({ storage });

router.post("/upload", upload.single("file"), (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file was uploaded.");
    }

    res.status(201).json({
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      fileUrl: `/uploads/${path.basename(req.file.filename)}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;