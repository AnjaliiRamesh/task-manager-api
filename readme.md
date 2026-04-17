# Task Manager API

A RESTful API for a Task Management application built with Node.js/Express.js, PostgreSQL, and MongoDB. Features JWT authentication, real-time reminders, task categorization, and webhook integrations.
# Demo video Link
https://www.loom.com/share/98d006abf4294f7eb6eb66981b39f2e9
## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **SQL Database:** PostgreSQL (via Sequelize ORM)
- **NoSQL Database:** MongoDB (via Mongoose ODM)
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Joi
- **HTTP Requests:** Axios
- **Environment Variables:** dotenv

## Folder Structure

```
task-manager-api/
│
├── config/
│   ├── db.postgres.js       # PostgreSQL connection
│   ├── db.mongo.js          # MongoDB connection
│   └── agenda.js            # In-memory reminder store
│
├── controllers/
│   ├── auth.controller.js   # Register, login, profile logic
│   ├── task.controller.js   # Task CRUD logic
│   └── category.controller.js # Category CRUD logic
│
├── jobs/
│   └── reminder.job.js      # Reminder scheduling logic
│
├── middleware/
│   ├── auth.middleware.js   # JWT verification
│   └── error.middleware.js  # Global error handler
│
├── models/
│   ├── user.model.js        # PostgreSQL User model
│   ├── task.model.js        # MongoDB Task model
│   └── category.model.js    # MongoDB Category model
│
├── routes/
│   ├── auth.routes.js       # /api/auth endpoints
│   ├── task.routes.js       # /api/tasks endpoints
│   └── category.routes.js   # /api/categories endpoints
│
├── services/
│   └── webhook.service.js   # Webhook + retry logic
│
├── validators/
│   └── validators.js        # Joi validation schemas
│
├── .env                     # Environment variables (not committed)
├── .gitignore               # Git ignore rules
└── index.js                 # Entry point
```

## Design Decisions

### PostgreSQL for Users
User data is structured and relational — always an ID, email and password — making SQL a natural fit. Sequelize ORM allows us to write JavaScript instead of raw SQL queries.

### MongoDB for Tasks and Categories
Tasks and categories are flexible documents that may evolve over time, with optional fields like description, tags and category references. This suits MongoDB's schema-less nature perfectly.

### JWT Authentication
Stateless authentication that scales well. Tokens contain user ID and email, expire in 7 days, and are verified on every protected request via middleware.

### Task Categorization
Categories are dynamically created by users (not pre-defined) because this gives users full flexibility to organize tasks their way. Each category belongs to a specific user, maintaining data isolation.

### Tag Management
Tags are stored as a free-form string array directly on the task document. This keeps the data model simple and avoids unnecessary joins. Tags can be filtered using MongoDB's `$in` operator.

### Reminder Scheduling
Reminders use an in-memory setTimeout-based system. When a task is created or updated with a due date, a reminder is scheduled for 1 hour before. The timeout reference is stored in memory so it can be cancelled if the task is updated or completed. Note: reminders are lost on server restart — for production, a persistent queue like BullMQ with Redis would be used.

### Webhook Retry Logic
When a task is completed, a webhook is sent to the configured URL with exponential backoff retry logic (3 attempts: 1s, 2s, 4s delays). This handles temporary network failures gracefully.

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

```bash
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

### 4. Set up MongoDB Atlas

- Create a free cluster on [MongoDB Atlas](https://cloud.mongodb.com)
- Get your connection string

### 5. Get a Webhook URL

- Go to [webhook.site](https://webhook.site)
- Copy your unique URL

### 6. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=3000
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=taskmanager
PG_USER=postgres
PG_PASSWORD=yourpassword
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager
AGENDA_DB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/taskmanager
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
WEBHOOK_URL=https://webhook.site/your-unique-url
```

### 7. Run the application

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
Body:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
Response (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "id": 1, "email": "user@example.com" }
}
```

---

#### Login User
```
POST /api/auth/login
```
Body:
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
Response (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "email": "user@example.com" }
  }
}
```

---

#### Get Profile (Protected)
```
GET /api/auth/profile
```
Response (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### Category Endpoints (All Protected)

#### Create Category
```
POST /api/categories
```
Body:
```json
{
  "name": "Work",
  "description": "Work related tasks"
}
```
Response (201):
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "...",
    "name": "Work",
    "description": "Work related tasks",
    "userId": 1
  }
}
```

---

#### Get All Categories
```
GET /api/categories
```
Response (200):
```json
{
  "success": true,
  "count": 3,
  "data": [...]
}
```

---

#### Get Single Category
```
GET /api/categories/:id
```

---

#### Update Category
```
PATCH /api/categories/:id
```
Body:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

---

#### Delete Category
```
DELETE /api/categories/:id
```

---

### Task Endpoints (All Protected)

#### Create Task
```
POST /api/tasks
```
Body:
```json
{
  "title": "Fix critical bug",
  "description": "Fix the login page bug",
  "dueDate": "2026-12-31T10:00:00.000Z",
  "status": "pending",
  "category": "<category_id>",
  "tags": ["High Priority", "Bug Fix", "Client A"]
}
```
Response (201):
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "...",
    "title": "Fix critical bug",
    "status": "pending",
    "category": "<category_id>",
    "tags": ["High Priority", "Bug Fix", "Client A"],
    "userId": 1
  }
}
```
Note: If dueDate is provided, a reminder is automatically scheduled for 1 hour before.

---

#### Get All Tasks (with optional filters)
```
GET /api/tasks
GET /api/tasks?category=<category_id>
GET /api/tasks?tags=High Priority,Bug Fix
GET /api/tasks?category=<category_id>&tags=Bug Fix
```
Response (200):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "...",
      "title": "Fix critical bug",
      "category": {
        "_id": "...",
        "name": "Work",
        "description": "Work related tasks"
      },
      "tags": ["High Priority", "Bug Fix", "Client A"]
    }
  ]
}
```

---

#### Get Single Task
```
GET /api/tasks/:id
```

---

#### Update Task (Partial)
```
PATCH /api/tasks/:id
```
Body (all fields optional):
```json
{
  "title": "Updated title",
  "status": "completed",
  "tags": ["Done"]
}
```
Note: Setting status to "completed" triggers a webhook notification and cancels any scheduled reminder.

---

#### Delete Task
```
DELETE /api/tasks/:id
```
Note: Deleting a task automatically cancels any scheduled reminder.

---

## Event-Driven Features

### Task Reminders
When a task is created or updated with a due date, a reminder is automatically scheduled for 1 hour before the due date. The reminder:
- Logs full notification details to the console
- Sends a POST request to the configured webhook URL
- Is automatically cancelled if the task is completed or deleted

### Webhook on Completion
When a task status changes to "completed", a POST request is sent to the configured webhook URL with this payload:
```json
{
  "event": "TASK_COMPLETED",
  "taskId": "...",
  "title": "Task title",
  "completionDate": "2026-01-01T00:00:00.000Z",
  "userId": 1,
  "category": "...",
  "tags": ["..."]
}
```
Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s delays).

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