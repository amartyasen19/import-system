
const express = require("express");
const router = express.Router();

const {
  getBatches,
  getBatchDetails,
  approveBatch
} = require("../controllers/batchController");

router.get("/", getBatches);

router.get("/:id", getBatchDetails);

router.post("/:id/approve", approveBatch);

module.exports = router;
