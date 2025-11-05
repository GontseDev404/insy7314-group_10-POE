//Core Imports
import "dotenv/config";
import fs from "fs";
import https from "https";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import csurf from "csurf";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import crypto from "crypto";
import dbPromise from "./db.js";
import { patterns } from "./security.js";

//App Configuration
const app = express();
const PORT = process.env.PORT || 8443;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND = process.env.FRONTEND_URL || "https://localhost:5173";

// Validate required environment variables
if (!JWT_SECRET) {
    console.error("❌ ERROR: JWT_SECRET environment variable is required!");
    console.error("   Create a .env file with JWT_SECRET=your-secret-key");
    process.exit(1);
}

//Security Middleware 
app.use(helmet());
app.use(morgan("tiny"));
app.use(compression());
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(cors({ origin: FRONTEND, credentials: true }));

//Rate Limiting 
app.use("/api/", rateLimit({ windowMs: 10 * 60 * 1000, max: 200 }));

//CSRF Protection 
// Note: httpOnly: false is set because the frontend fetches CSRF tokens via /api/csrf endpoint
// This is a security trade-off - tokens are accessible to JavaScript, making them vulnerable to XSS.
// Consider implementing double-submit cookie pattern in future for enhanced security:
// - Store CSRF token in httpOnly cookie (not accessible to JS)
// - Also send token in custom header or form field
// - Validate both match on the server
const csrfProtection = csurf({
    cookie: {
        key: "csrf",
        sameSite: "strict",
        httpOnly: false, // Security trade-off: allows JS access for /api/csrf endpoint
        secure: true
    }
});
app.use(csrfProtection);

app.get("/api/csrf", (req, res) => res.json({ csrf: req.csrfToken() }));

//Helper Functions 
function signSession(user) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
}

// Security event logging
function logSecurityEvent(event, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        event,
        ...details
    };
    console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);
}

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
}

function setSessionCookie(res, token) {
    res.cookie("session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/"
    });
}

function requireAuth(req, res, next) {
    const token = req.cookies.session;
    if (!token) return res.status(401).json({ error: "Unauthenticated" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid/expired session" });
    }
}

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Trim whitespace from string fields
    if (req.body.email) req.body.email = req.body.email.trim();
    if (req.body.fullName) req.body.fullName = req.body.fullName.trim();
    if (req.body.password) req.body.password = req.body.password.trim();
    if (req.body.beneficiaryName) req.body.beneficiaryName = req.body.beneficiaryName.trim();
    if (req.body.swift) req.body.swift = req.body.swift.trim().toUpperCase();
    if (req.body.iban) req.body.iban = req.body.iban.trim().toUpperCase();
    if (req.body.currency) req.body.currency = req.body.currency.trim().toUpperCase();
    if (req.body.reference) req.body.reference = req.body.reference.trim();
    next();
};

//Validation Rules 
const registerRules = [
    body("email").matches(patterns.email),
    body("fullName").matches(patterns.fullName),
    body("password").matches(patterns.password)
];

const loginRules = [
    body("email").matches(patterns.email),
    body("password").isString().isLength({ min: 1 })
];

const paymentRules = [
    body("beneficiaryName").matches(patterns.beneficiaryName),
    body("swift").matches(patterns.swift),
    body("iban").matches(patterns.iban),
    body("amount").isNumeric(),
    body("currency").matches(patterns.currency)
];

//ROUTES 

// Register a new user
app.post("/api/register", sanitizeInput, registerRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    const db = await dbPromise;
    const { email, fullName, password } = req.body;

    const existing = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (existing) {
        return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 12);
    await db.run(
        "INSERT INTO users (email, full_name, password_hash, created_at) VALUES (?, ?, ?, datetime('now'))",
        email,
        fullName,
        hash
    );

    logSecurityEvent("USER_REGISTRATION", {
        email,
        ip: getClientIP(req),
        success: true
    });

    res.status(201).json({ ok: true });
});

// Login an existing user
app.post("/api/login", sanitizeInput, loginRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    const db = await dbPromise;
    const { email, password } = req.body;
    const clientIP = getClientIP(req);

    const user = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (!user) {
        logSecurityEvent("LOGIN_ATTEMPT", {
            email,
            ip: clientIP,
            success: false,
            reason: "user_not_found"
        });
        return res.status(401).json({ error: "Invalid credentials", details: [] });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        logSecurityEvent("LOGIN_ATTEMPT", {
            email,
            ip: clientIP,
            success: false,
            reason: "invalid_password"
        });
        return res.status(401).json({ error: "Invalid credentials", details: [] });
    }

    logSecurityEvent("LOGIN_ATTEMPT", {
        email,
        userId: user.id,
        ip: clientIP,
        success: true
    });

    const token = signSession(user);
    setSessionCookie(res, token);

    res.json({
        user: { id: user.id, email: user.email, fullName: user.full_name }
    });
});

// Logout user
app.post("/api/logout", (req, res) => {
    res.cookie("session", "", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        expires: new Date(0)
    });
    res.json({ ok: true });
});

// Create a new payment
app.post("/api/payments", requireAuth, sanitizeInput, paymentRules, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }

    const db = await dbPromise;
    const { beneficiaryName, swift, iban, amount, currency, reference } = req.body;

    const id = "pm_" + crypto.randomBytes(8).toString("hex");
    await db.run(
        "INSERT INTO payments (id, user_id, beneficiary_name, swift, iban, amount, currency, reference, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', datetime('now'))",
        id,
        req.user.sub,
        beneficiaryName,
        swift,
        iban,
        amount,
        currency,
        reference || null
    );

    logSecurityEvent("PAYMENT_CREATED", {
        paymentId: id,
        userId: req.user.sub,
        amount,
        currency,
        ip: getClientIP(req)
    });

    res.status(201).json({ paymentId: id, status: "QUEUED" });
});

// Get all payments for the logged-in user
app.get("/api/payments", requireAuth, async (req, res) => {
    const db = await dbPromise;
    const rows = await db.all(
        "SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
        req.user.sub
    );
    res.json({ items: rows });
});

//HTTPS Setup
const keyPath = "./certs/key.pem";
const certPath = "./certs/cert.pem";

let server;
try {
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        console.error("\n❌ ERROR: TLS certificates not found!");
        console.error("   Certificate files required:");
        console.error(`   - ${keyPath}`);
        console.error(`   - ${certPath}`);
        console.error("\n   To create self-signed certificates, run:");
        console.error("   npm run make:certs");
        console.error("\n   Or generate them manually using OpenSSL.\n");
        process.exit(1);
    }

    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);

    server = https.createServer(
        {
            key: key,
            cert: cert
        },
        app
    );
} catch (error) {
    console.error("\n❌ ERROR: Failed to load TLS certificates!");
    console.error(`   ${error.message}`);
    console.error("\n   Please ensure certificate files exist and are readable.\n");
    process.exit(1);
}

//Start Server 
server.listen(PORT, () => {
    console.log(`✅ HTTPS API listening on https://localhost:${PORT}`);
});

// Graceful shutdown handler
async function gracefulShutdown(signal) {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
        console.log("HTTP server closed.");
        
        try {
            // Close database connection
            const db = await dbPromise;
            await db.close();
            console.log("Database connection closed.");
            process.exit(0);
        } catch (error) {
            console.error("Error closing database:", error);
            process.exit(1);
        }
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
}

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
