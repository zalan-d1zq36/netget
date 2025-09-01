import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const SECRET = "nagyonTitkosKulcs"; // később .env-be

// Demo user
const users = [
    { id: 1, email: "test@netget.hu", password: "123456" }
];

// Bejelentkezés
router.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Hibás adatok" });

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "1h" });
    res.json({ token });
});

// Middleware a védett route-okra
export function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

export default router;
