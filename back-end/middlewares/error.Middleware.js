const errorMiddleware = (err, _req, res, _next) => {
  const statusCode =
    err.statusCode ||
    (err.name === "MulterError" ? 400 : 500);

  const message =
    err.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || null,
    stack: err.stack,
  });
};

export default errorMiddleware;