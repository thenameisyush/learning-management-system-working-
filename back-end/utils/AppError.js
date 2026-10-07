class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;