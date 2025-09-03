const express = require("express");
const router = express.Router();
const { getEmployees } = require("../controllers/employeeController");

// GET all employees
router.get("/", getEmployees);

module.exports = router;
