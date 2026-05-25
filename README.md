# Secure User Registration System

A client-side web application for user registration and login with password strength checking, SHA-512 hashing, and SQLite-based data persistence via IndexedDB.

## Features

- **User Registration** — Create an account with a username and password
- **Password Strength Indicator** — Real-time feedback (Weak / Medium / Strong) on both registration and login pages
- **SHA-512 Hashing** — Passwords are hashed client-side using the Web Crypto API before storage
- **SQLite Database** — User data is stored in a SQLite database running in-browser via sql.js (WebAssembly)
- **IndexedDB Persistence** — The SQLite database file is persisted to IndexedDB, surviving page reloads and browser restarts
- **Dashboard** — After login, view all registered users and their password hashes

https://ekjibon.github.io/secure_user_registration_system

## Project Structure

```
├── index.html         Home page with navigation to Register and Login
├── register.html      Registration form with password strength meter
├── login.html         Login form with password strength meter
├── dashboard.html     Post-login dashboard showing all users
├── script.js          Application logic (DB, hashing, auth)
├── style.css          Styling
└── README.md          This file
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling |
| Vanilla JavaScript (ES6+) | Application logic |
| [sql.js](https://github.com/sql-js/sql.js) | SQLite compiled to WebAssembly, runs in-browser |
| IndexedDB | Persisting the SQLite database file |
| Web Crypto API | SHA-512 password hashing |

No build tools, bundlers, or server-side runtime required.

## How It Works

### Database Layer (`script.js`)

```
Browser Memory: sql.js SQLite database (in-memory WASM)
                      ↕ (export / load binary)
IndexedDB: "SecureUserDB" → ObjectStore "sqlite" → key "db"
```

- `initDB()` — Initializes the SQLite WASM engine. On first visit, creates a fresh database and users table. On subsequent visits, restores the existing database from IndexedDB.
- `saveToIndexedDB()` — Exports the in-memory SQLite database as a `Uint8Array` binary and stores it in IndexedDB.
- `loadFromIndexedDB()` — Reads the binary database from IndexedDB and returns it to be loaded into sql.js.

### SQL Schema

```sql
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL
);
```

### User Flow

1. **Register** → Enter username + password → password strength shown in real-time → on submit, password is SHA-512 hashed → inserted into SQLite `users` table → database exported to IndexedDB
2. **Login** → Enter username + password → password strength shown in real-time → on submit, password is SHA-512 hashed → compared against stored hash in SQLite → on match, redirect to dashboard
3. **Dashboard** → Reads all users from SQLite → displays table of usernames and password hashes → shows "Logged in as: <username>"

## Running the Project

Since this is a static client-side application, simply open any HTML file in a web browser:

```
Start from index.html and navigate to Register or Login.
```

**Note:** sql.js loads a ~1.2MB WebAssembly binary from `https://sql.js.org/dist/sql-wasm.wasm` on first initialization. An internet connection is required for the initial load.
