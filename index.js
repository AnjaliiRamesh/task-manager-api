const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db.postgres');
const connectMongo = require('./config/db.mongo');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Task Manager API is running!' });
});

// Error Handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test PostgreSQL connection
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');

    // Sync models to database (creates tables if they dont exist)
    await sequelize.sync({ alter: true });
    console.log('PostgreSQL models synced');

    // Connect MongoDB
    await connectMongo();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();