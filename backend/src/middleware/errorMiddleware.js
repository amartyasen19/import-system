
const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File size must not exceed 5 MB"
    });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: status >= 500 ? "An unexpected server error occurred" : (err.message || "Request failed")
  });
};

module.exports = errorMiddleware;
