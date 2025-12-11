# 🎓 Edu-Jeopardy

A web-based interactive quiz game inspired by Jeopardy, designed for the 8th HSDC UNHAS Competition. This project moves beyond static HTML by using a serverless backend and a database to manage questions dynamically.

## ✨ Features

* **Interactive Game Board:** 3 Categories with 3 difficulty levels (10-40 points).
* **Dynamic Content:** Questions are fetched from a database, not hardcoded.
* **Admin Panel:** Secure, password-protected interface (`/admin`) to edit questions and answers without touching code.
* **Responsive Design:** Works on desktops and mobile devices.
* **Fallback Mode:** Includes dummy data if the database connection fails.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Flexbox/Grid), Vanilla JavaScript.
* **Backend:** Node.js (Vercel Serverless Functions).
* **Database:** Turso (libSQL) / SQLite.
* **Deployment:** Vercel.

## 🚀 Local Setup

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/edu-jeopardy.git](https://github.com/yourusername/edu-jeopardy.git)
    cd edu-jeopardy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory:
    ```env
    DATABASE_URL=libsql://your-db-name.turso.io
    TURSO_AUTH_TOKEN=your-turso-token
    ADMIN_PASSCODE_HASH=your-hashed-password
    ```

4.  **Initialize the Database**
    Run the setup script to create tables and seed initial categories:
    ```bash
    npm run setup-db
    ```

5.  **Run Locally**
    ```bash
    vercel dev
    ```
    Visit `http://localhost:3000` for the game and `http://localhost:3000/admin` for the dashboard.
