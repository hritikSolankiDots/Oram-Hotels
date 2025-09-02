
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const { port } = require('./src/config');
const hubspotRoutes = require('./src/routes/hubspotRoutes');
const ticketRoutes = require('./src/routes/ticketRoutes');


const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Welcome to the HubSpot Ticket Management API');
});

// Routes
app.use('/api/hubspot', hubspotRoutes);
app.use("/api/tickets", ticketRoutes);


const { errorHandler } = require('./src/middlewares/errorHandler');

// Error Handling Middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
