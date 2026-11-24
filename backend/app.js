
const express = require("express");
const cors = require("cors");
const path = require("path");

const uploadRoutes = require("./src/routes/uploadRoutes");
const batchRoutes = require("./src/routes/batchRoutes");
const auditRoutes = require("./src/routes/auditRoutes");

const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend
app.use(express.static(
  path.join(__dirname, "../frontend")
));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Transaction Import API is running"
  });
});

// API routes
app.use("/upload", uploadRoutes);
app.use("/batches", batchRoutes);
app.use("/audit-logs", auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// Centralized error handling
app.use(errorMiddleware);

module.exports = app;
