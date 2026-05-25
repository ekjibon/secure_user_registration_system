let db;
let initPromise = null;

async function initDB() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        const saved = await loadFromIndexedDB();
        db = saved ? new SQL.Database(saved) : new SQL.Database();
        db.run("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, full_name TEXT NOT NULL, phone TEXT NOT NULL, password_hash TEXT NOT NULL)");
        if (!saved) await saveToIndexedDB();
    })();
    return initPromise;
}

function saveToIndexedDB() {
    return new Promise((resolve, reject) => {
        const data = db.export();
        const request = indexedDB.open("SecureUserDB", 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore("sqlite");
        };
        request.onsuccess = (e) => {
            const tx = e.target.result.transaction("sqlite", "readwrite");
            const put = tx.objectStore("sqlite").put(data, "db");
            put.onsuccess = () => resolve();
            put.onerror = () => reject(put.error);
        };
        request.onerror = () => reject(request.error);
    });
}

function loadFromIndexedDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open("SecureUserDB", 1);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore("sqlite");
        };
        request.onsuccess = (e) => {
            const tx = e.target.result.transaction("sqlite", "readonly");
            const get = tx.objectStore("sqlite").get("db");
            get.onsuccess = () => resolve(get.result || null);
        };
        request.onerror = () => resolve(null);
    });
}

function showStrength(passwordId = "password", strengthId = "strengthText") {
    const password = document.getElementById(passwordId).value;
    const strengthText = document.getElementById(strengthId);
    let strength = checkStrength(password);
    strengthText.innerText = "Password Strength: " + strength;
    if (strength === "Weak") {
        strengthText.style.color = "red";
    } else if (strength === "Medium") {
        strengthText.style.color = "orange";
    } else {
        strengthText.style.color = "green";
    }
}

function checkStrength(password) {
    if (password.length < 6) return "Weak";
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    if (hasUpper && hasLower && hasNumber && hasSpecial && password.length >= 8) return "Strong";
    return "Medium";
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function validateField(id) {
    const input = document.getElementById(id);
    const error = document.getElementById(id + "Error");
    const value = input.value.trim();
    let msg = "";

    if (id === "fullName") {
        if (value === "") msg = "Full Name is required.";
        else if (!/^[a-zA-Z\s\.]+$/.test(value)) msg = "Only letters, spaces, and dots allowed.";
        else if (value.length < 2) msg = "Must be at least 2 characters.";
    } else if (id === "email" || id === "loginEmail") {
        if (value === "") msg = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = "Enter a valid email address.";
    } else if (id === "phone") {
        if (value === "") msg = "Phone number is required.";
        else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(value)) msg = "Enter a valid phone number (7-15 digits).";
    } else if (id === "password" || id === "loginPassword") {
        if (value === "") msg = "Password is required.";
        else if (value.length < 6) msg = "Must be at least 6 characters.";
    }

    error.innerText = msg;
    input.className = msg ? "invalid" : "valid";
    return msg === "";
}

async function registerUser() {
    await initDB();
    const fields = ["fullName", "email", "phone", "password"];
    let valid = true;
    fields.forEach(id => { if (!validateField(id)) valid = false; });
    if (!valid) return;

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    const stmt = db.prepare("SELECT email FROM users WHERE email = ?");
    stmt.bind([email]);
    if (stmt.step()) {
        stmt.free();
        document.getElementById("emailError").innerText = "Email already registered.";
        document.getElementById("email").className = "invalid";
        return;
    }
    stmt.free();
    const hashedPassword = await hashPassword(document.getElementById("password").value);
    db.run("INSERT INTO users (email, full_name, phone, password_hash) VALUES (?, ?, ?, ?)", [email, fullName, phone, hashedPassword]);
    await saveToIndexedDB();
    window.location.href = "login.html";
}

async function loginUser() {
    await initDB();
    document.getElementById("loginError").innerText = "";

    const fields = ["loginEmail", "loginPassword"];
    let valid = true;
    fields.forEach(id => { if (!validateField(id)) valid = false; });
    if (!valid) return;

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const hashedPassword = await hashPassword(password);
    const stmt = db.prepare("SELECT password_hash FROM users WHERE email = ?");
    stmt.bind([email]);
    let match = false;
    if (stmt.step()) {
        const row = stmt.getAsObject();
        match = (row.password_hash === hashedPassword);
    }
    stmt.free();
    if (match) {
        window.location.href = "dashboard.html?email=" + encodeURIComponent(email);
    } else {
        document.getElementById("loginError").innerText = "Invalid Email or Password";
        document.getElementById("loginEmail").className = "invalid";
        document.getElementById("loginPassword").className = "invalid";
    }
}

function loadAllUsers() {
    const users = [];
    const stmt = db.prepare("SELECT email, full_name, phone, password_hash FROM users ORDER BY email");
    while (stmt.step()) {
        users.push(stmt.getAsObject());
    }
    stmt.free();
    return users;
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("darkMode", isDark);
    const btn = document.getElementById("darkModeToggle");
    if (btn) btn.innerText = isDark ? "☀️" : "🌙";
}

function initDarkMode() {
    const btn = document.getElementById("darkModeToggle");
    if (!btn) return;
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
        btn.innerText = "☀️";
    }
}
