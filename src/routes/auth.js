import express from "express";
import jwt from "jsonwebtoken";

const authRouter = express.Router();
const SECRET = process.env.JWT_SECRET;
console.log(SECRET);
const users = [
    { id: 1, email: process.env.USERNAME, password: process.env.PASSWORD }
];
console.log(`[AUTH] Loaded users: ${users.map(u => u.email).join(", ")}`);

authRouter.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN] Attempt: email=${email}, password=${password}`);
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        console.log("[LOGIN] Failed: Invalid credentials");
        return res.status(401).json({ error: "Hibás adatok" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "1h" });
    console.log(`[LOGIN] Success: email=${email}, token=${token}`);
    res.json({ success: true, token });
});

export function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    console.log(`[AUTH] Header: ${authHeader}`);
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        console.log("[AUTH] Failed: No token provided");
        return res.sendStatus(401);
    }

    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            console.log("[AUTH] Failed: Invalid token", err);
            return res.sendStatus(403);
        }
        console.log(`[AUTH] Success: User ${JSON.stringify(user)}`);
        req.user = user;
        next();
    });
}

export default authRouter;
