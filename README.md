# Thought.Click

The Ultimate Visual Workspace for modern visionaries.

Thought.Click is a premium, fluid canvas designed for capturing and organizing your ideas. Built with React and powered by a full-stack Node.js/SQLite backend, it offers a secure and high-performance environment for your digital vision.

## 🚀 Key Features

- **🔐 Secure Accounts**: JWT-based authentication with bcrypt hashing.
- **📁 Full-Stack Persistence**: All your boards and thoughts are stored safely in a local SQLite database.
- **🎨 Glassmorphism UI**: A stunning, modern interface with fluid animations and premium aesthetics.
- **🧠 Interactive Thoughts**: Support for Text, Links, Images, and interactive Checklists.
- **🔗 Intelligent Branching**: Automatically connect thoughts with animated lines to visualize relationships.
- **🗺️ Infinite Canvas**: Pan and zoom (up to 500%) across a vast workspace.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Framer Motion, Lucide React
- **Backend**: Node.js, Express, tsx
- **Database**: SQLite (better-sqlite3)
- **Session**: JSON Web Tokens (JWT)

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root based on the configuration:
   ```env
   PORT=3001
   JWT_SECRET=your_super_secret_key_here
   ```

### Running the App

Start both the backend and frontend concurrently:

```bash
npm start
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
