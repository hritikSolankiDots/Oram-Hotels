const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const Employee = require('./src/models/Employee');

const employees = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'developer',
    password: 'password123',
    ownerId: '76029065',
  },
  {
    name: 'Peter Jones',
    email: 'peter.jones@example.com',
    role: 'developer',
    password: 'password123',
    ownerId: '76029065',
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'designer',
    password: 'password456',
    ownerId: '64692333',
  },
  {
    name: 'Mary Williams',
    email: 'mary.williams@example.com',
    role: 'designer',
    password: 'password456',
    ownerId: '64692333',
  },
];

const seedDB = async () => {
  await connectDB();
  try {
    await Employee.deleteMany({});
    await Employee.insertMany(employees);
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.disconnect();
  }
};

seedDB();