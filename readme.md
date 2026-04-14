# Task Manager API

A RESTful API for a Task Management application built with Node.js/Express.js, PostgreSQL, and MongoDB.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **SQL Database:** PostgreSQL (via Sequelize ORM)
- **NoSQL Database:** MongoDB (via Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Joi
- **Environment Variables:** dotenv

## Folder Structure

```
task-manager-api/
│
├── config/
│   ├── db.postgres.js       # PostgreSQL connection
│   └── db.mongo.js          # MongoDB connection
│
├── controllers/
│   ├── auth.controller.js   # Register, login, profile logic
│   └── task.controller.js   # Task CRUD logic
│
├── middleware/
│   ├── auth.middleware.js   # JWT verification
│   └── error.middleware.js  # Global error handler
│
├── models/
│   ├── user.model.js        # PostgreSQL User model (Sequelize)
│   └── task.model.js        # MongoDB Task model (Mongoose)
│
├── routes/
│   ├── auth.routes.js       # /api/auth endpoints
│   └── task.routes.js       # /api/tasks endpoints
│
├── validators/
│   └── validators.js        # Joi validation schemas
│
├── .env                     # Environment variables (not committed)
├── .gitignore               # Git ignore rules
└── index.js                 # Entry point
```

## Design Decisions

- **PostgreSQL for Users:** User data is structured and relational, making SQL a natural fit.
- **MongoDB for Tasks:** Tasks are flexible documents that may evolve over time, making NoSQL ideal.
- **JWT Authentication:** Stateless authentication that scales well.
- **Joi Validation:** Centralized validation schemas keep controllers clean.
- **Global Error Handler:** Single middleware handles all errors consistently.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- MongoDB Atlas account

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/task-manager-api.git
cd task-manager-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PostgreSQL

- Install PostgreSQL and create a database:

```bash
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

### 4. Set up MongoDB

- Create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com)
- Get your connection string

### 5. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=3000
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=taskmanager
PG_USER=postgres
PG_PASSWORD=yourpassword
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
```

### 6. Run the application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

### Auth Endpoints

#### Register User
```
POST /api/auth/register
```
Request Body:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
Success Response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com"
  }
}
```
Error Response (400):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

#### Login User
```
POST /api/auth/login
```
Request Body:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
Success Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

---

#### Get Profile (Protected)
```
GET /api/auth/profile
```
Headers:
```
Authorization: Bearer <token>
```
Success Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Task Endpoints (All Protected)

#### Create Task
```
POST /api/tasks
```
Headers:
```
Authorization: Bearer <token>
```
Request Body:
```json
{
  "title": "My Task",
  "description": "Task description",
  "dueDate": "2024-12-31",
  "status": "pending"
}
```
Success Response (201):
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "mongodbid",
    "title": "My Task",
    "description": "Task description",
    "dueDate": "2024-12-31T00:00:00.000Z",
    "status": "pending",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### Get All Tasks
```
GET /api/tasks
```
Headers:
```
Authorization: Bearer <token>
```
Success Response (200):
```json
{
  "success": true,
  "count": 1,
  "data": [...]
}
```

---

#### Get Single Task
```
GET /api/tasks/:id
```
Headers:
```
Authorization: Bearer <token>
```
Success Response (200):
```json
{
  "success": true,
  "data": {...}
}
```
Error Response (403):
```json
{
  "success": false,
  "message": "Access denied. This task belongs to another user."
}
```

---

#### Update Task (Partial)
```
PATCH /api/tasks/:id
```
Headers:
```
Authorization: Bearer <token>
```
Request Body (all fields optional):
```json
{
  "title": "Updated title",
  "status": "completed"
}
```
Success Response (200):
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {...}
}
```

---

#### Delete Task
```
DELETE /api/tasks/:id
```
Headers:
```
Authorization: Bearer <token>
```
Success Response (200):
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong user) |
| 404 | Not Found |
| 500 | Internal Server Error |