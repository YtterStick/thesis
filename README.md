# StarWash V2 🚿

A modern laundry management system built with React, Spring Boot, and MongoDB.

## 🚀 Features

- **User Authentication**: Secure login and registration.
- **Service Management**: Track laundry services and statuses.
- **Dashboard**: Real-time insights and management tools.
- **Responsive Design**: Works on mobile and desktop.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Spring Boot, Java 21/24, Gradle.
- **Database**: MongoDB (Atlas).
- **Security**: JWT (JSON Web Tokens).

## 🏁 Getting Started

### Prerequisites

- **Java**: JDK 21 or higher (Tested on JDK 24).
- **Node.js**: v18 or higher.
- **npm**: v9 or higher.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend/authservice
   ```
2. Run the application using Gradle:
   ```bash
   ./gradlew bootRun
   ```
   *Note: The backend runs on port 8080 by default.*

### Frontend Setup

1. Navigate to the root directory:
   ```bash
   cd ../..
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *Note: The frontend runs on port 3000.*

## ⚙️ Configuration

### Backend (`backend/authservice/src/main/resources/application.properties`)
- `spring.data.mongodb.uri`: MongoDB connection string.
- `app.jwt.secret`: Secret key for JWT signing.
- `server.port`: Backend port (Default: 8080).

### Frontend (`.env`)
- `VITE_API_BASE_URL`: URL of the running backend.

## 📄 License

This project is private and for internal use only.
