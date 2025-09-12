import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import config from "../config.js";
import { secureLog } from "../utils/security.js";

const authRouter = express.Router();

// Load users from credentials.json
let credentials;
try {
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    const credentialsData = fs.readFileSync(credentialsPath, 'utf8');
    credentials = JSON.parse(credentialsData);
    secureLog('info', 'Credentials loaded successfully', { usersCount: credentials.users.length });
} catch (error) {
    secureLog('error', 'Failed to load credentials.json', { error: error.message });
    throw new Error('Authentication system initialization failed');
}

const users = credentials.users.filter(user => user.active);

authRouter.post("/login", async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    try {
        const { email, password } = req.body;
        
        // Input validation
        if (!email || !password) {
            secureLog('warn', 'Login attempt with missing credentials', { ip: clientIP });
            return res.status(400).json({ error: "Email és jelszó megadása kötelező" });
        }
        
        const user = users.find(u => u.email === email);
        if (!user) {
            secureLog('warn', 'Login attempt with invalid email', { email, ip: clientIP });
            return res.status(401).json({ error: "Hibás adatok" });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            secureLog('warn', 'Login attempt with invalid password', { email, ip: clientIP });
            return res.status(401).json({ error: "Hibás adatok" });
        }

        const token = jwt.sign({ 
            id: user.id, 
            email: user.email, 
            role: user.role,
            name: user.name 
        }, config.JWT_SECRET, { expiresIn: "1h" });
        
        secureLog('info', 'Successful login', { userId: user.id, email: user.email, ip: clientIP });
        res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    } catch (error) {
        secureLog('error', 'Login error', { error: error.message, ip: clientIP });
        res.status(500).json({ error: "Szerver hiba" });
    }
});

// Role checking helper functions
export function hasRole(user, role) {
    return user && user.role === role;
}

export function hasPermission(user, permission) {
    if (!user || !user.role) return false;
    const roleConfig = credentials.roles[user.role];
    return roleConfig && roleConfig.permissions.includes(permission);
}

export function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || !hasRole(req.user, role)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    };
}

export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user || !hasPermission(req.user, permission)) {
            return res.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    };
}

export function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

export default authRouter;
