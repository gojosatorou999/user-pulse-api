# User Activity Tracker API

A lightweight backend system to log and retrieve user activities like login, logout, and custom actions. Built with **Node.js**, **Express**, and **SQLite**.

---

## 🛠 Features

- **Activity Logging**: Store user-id, activity type, and timestamps.
- **Activity Retrieval**: Fetch all logged activities.
- **Filtering**: Filter activities by `user_id`, `type`, `start_date`, or `end_date`.
- **Lightweight Database**: Uses SQLite (no external setup required).

---

## 📂 Project Structure

- `index.js`: Main Express server and API routes.
- `database.js`: SQLite initialization and schema management.
- `database.sqlite`: The actual SQLite database file.
- `test_api.js`: A script to seed and test the API.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
node index.js
```
The server runs on **http://localhost:3000** by default.

### 4. Run the Test Script
In a separate terminal (while the server is running):
```bash
node test_api.js
```

---

## 📡 API Endpoints

### 1. Log an Activity
**POST** `/api/activities`

**Body**:
```json
{
  "user_id": "user_123",
  "type": "login",
  "description": "User logged in after 2 hours"
}
```

### 2. Fetch Activities (with Filtering)
**GET** `/api/activities`

**Query Parameters (Optional)**:
- `user_id`: Filter by specific user.
- `type`: Filter by activity type (`login`, `logout`, `action`).
- `start_date`: Fetch from a specific timestamp.
- `end_date`: Fetch up to a specific timestamp.

**Example**:
`GET /api/activities?user_id=user_123&type=login`

### 3. Fetch Single Activity
**GET** `/api/activities/:id`

---

## 🏗 Database Schema

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary key, autoincremented. |
| `user_id` | `TEXT` | ID of the user performing the activity. |
| `type` | `TEXT` | Type of activity (e.g., login, logout, action). |
| `description` | `TEXT` | Optional description of the action. |
| `timestamp` | `DATETIME` | Automatic timestamp of the activity. |

---

## 🧪 Example API Response
```json
{
  "count": 1,
  "activities": [
    {
      "id": 5,
      "user_id": "user_123",
      "type": "login",
      "description": "User Logged In",
      "timestamp": "2026-03-31 18:22:15"
    }
  ]
}
```
