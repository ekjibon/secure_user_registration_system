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
        db.run("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL)");
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

async function registerUser() {
    await initDB();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (username === "" || password === "") {
        alert("Please fill all fields.");
        return;
    }
    const stmt = db.prepare("SELECT username FROM users WHERE username = ?");
    stmt.bind([username]);
    if (stmt.step()) {
        stmt.free();
        alert("Username already exists.");
        return;
    }
    stmt.free();
    const hashedPassword = await hashPassword(password);
    db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", [username, hashedPassword]);
    await saveToIndexedDB();
    alert("Registration Successful!");
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("strengthText").innerText = "";
}

async function loginUser() {
    await initDB();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (username === "" || password === "") {
        alert("Please fill all fields.");
        return;
    }
    const hashedPassword = await hashPassword(password);
    const stmt = db.prepare("SELECT password_hash FROM users WHERE username = ?");
    stmt.bind([username]);
    let match = false;
    if (stmt.step()) {
        const row = stmt.getAsObject();
        match = (row.password_hash === hashedPassword);
    }
    stmt.free();
    if (match) {
        window.location.href = "dashboard.html?username=" + encodeURIComponent(username);
    } else {
        alert("Invalid Username or Password");
    }
}

function loadAllUsers() {
    const users = [];
    const stmt = db.prepare("SELECT username, password_hash FROM users ORDER BY username");
    while (stmt.step()) {
        users.push(stmt.getAsObject());
    }
    stmt.free();
    return users;
}
