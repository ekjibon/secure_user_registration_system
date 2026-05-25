# Secure User Registration System

A client-side web application for user registration and login with password strength checking, SHA-512 hashing, inline field validation, dark mode, and SQLite-based data persistence via IndexedDB.

## Features

- **User Registration** — Register with Full Name, Email, Phone, and Password
- **Inline Field Validation** — Real-time validation on every field with red/green border indicators and error messages
- **Password Strength Indicator** — Real-time feedback (Weak / Medium / Strong)
- **SHA-512 Hashing** — Passwords are hashed client-side using the Web Crypto API before storage
- **SQLite Database** — User data is stored in a SQLite database running in-browser via sql.js (WebAssembly)
- **IndexedDB Persistence** — The SQLite database file is persisted to IndexedDB, surviving page reloads and browser restarts
- **Dashboard** — After login, view all registered users (Email, Full Name, Phone, Password Hash)
- **Dark Mode** — Toggle dark mode on any page, preference saved in localStorage

https://ekjibon.github.io/secure_user_registration_system

## Project Structure

```
├── index.html         Home page with navigation to Register and Login
├── register.html      Registration form with validation and password meter
├── login.html         Login form with validation and password meter
├── dashboard.html     Post-login dashboard showing all users
├── script.js          Application logic (DB, hashing, auth, validation, dark mode)
├── style.css          Styling including dark mode and validation
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
    email TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL
);
```

### User Flow

1. **Register** → Fill Full Name, Email, Phone, Password → real-time inline validation on all fields → on submit, password is SHA-512 hashed → inserted into SQLite `users` table → redirected to login page
2. **Login** → Enter Email + Password → real-time inline validation → on submit, password is SHA-512 hashed → compared against stored hash in SQLite → on match, redirect to dashboard
3. **Dashboard** → Reads all users from SQLite → displays table of Email, Full Name, Phone, and Password Hash → shows "Logged in as: <email>"

### Field Validation Rules

| Field | Rules |
|-------|-------|
| Full Name | Required, letters/spaces/dots only, min 2 characters |
| Email | Required, valid email format, must be unique |
| Phone | Required, digits/spaces/+-/parentheses, 7-15 characters |
| Password | Required, min 6 characters |

### Dark Mode

- Toggle button (🌙/☀️) in the top-right corner of every page
- Preference saved to `localStorage` — persists across page reloads and browser sessions

## Running the Project

Since this is a static client-side application, simply open any HTML file in a web browser:

```
Start from index.html and navigate to Register or Login.
```

**Note:** sql.js loads a ~1.2MB WebAssembly binary from `https://sql.js.org/dist/sql-wasm.wasm` on first initialization. An internet connection is required for the initial load.
