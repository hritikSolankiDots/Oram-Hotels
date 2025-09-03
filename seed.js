const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const connectDB = require("./src/config/database");
const Employee = require("./src/models/Employee");

const employees = [
  {
    name: "Peter Jones",
    email: "peter.jones@example.com",
    role: "developer",
    password: "password123",
    ownerId: "43694567",
  },
  {
    name: "Mary Williams",
    email: "mary.williams@example.com",
    role: "designer",
    password: "password456",
    ownerId: "12758316",
  },
];

const seedDB = async () => {
  await connectDB();
  try {
    // Hash passwords before inserting
    const hashedEmployees = await Promise.all(
      employees.map(async (emp) => {
        const salt = await bcrypt.genSalt(10);
        emp.password = await bcrypt.hash(emp.password, salt);
        return emp;
      })
    );

    await Employee.deleteMany({});
    await Employee.insertMany(hashedEmployees);

    console.log("✅ Database seeded successfully with hashed passwords");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    mongoose.disconnect();
  }
};

seedDB();
