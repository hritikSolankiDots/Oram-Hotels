const Employee = require("../models/Employee");

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public (or protect later with auth)
exports.getEmployees = async (req, res) => {
  try {
    // Exclude password field
    const employees = await Employee.find({}, "-password");

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching employees",
      error: error.message,
    });
  }
};

