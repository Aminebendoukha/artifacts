import prismaClientPkg from "@prisma/client";

const { Prisma } = prismaClientPkg;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function notFound(req, res, next) {
  next(new ApiError(404, `Route ${req.originalUrl} not found.`));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let status = err.status ?? err.statusCode ?? 500;
  let message = err.message ?? "Internal server error.";

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      status = 404;
      message = "Record not found.";
    } else if (err.code === "P2002") {
      status = 409;
      message = "A record with the same unique value already exists.";
    }
  }

  if (err.name === "MulterError") {
    status = 400;
  }

  res.status(status).json({ error: message, status });
}