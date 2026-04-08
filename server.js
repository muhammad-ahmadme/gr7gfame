const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your index.html to talk to this server

// Your CockroachDB Connection String
const connectionString = "postgresql://0552903361:6eF-3-CVc-Tmik-19bo0Og@doting-lioness-24499.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full";

const pool = new Pool({ connectionString });

// Initialize Table
const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            username TEXT PRIMARY KEY,
            score INTEGER,
            ts TIMESTAMPTZ DEFAULT now()
        );
    `);
    console.log("CockroachDB Table Ready.");
};
initDB();

// API Route to save score
app.post('/save', async (req, res) => {
    const { username, score } = req.body;
    try {
        await pool.query(
            "INSERT INTO leaderboard (username, score) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET score = EXCLUDED.score, ts = now()",
            [username, score]
        );
        res.json({ status: "success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Route to get leaderboard
app.get('/leaderboard', async (req, res) => {
    const result = await pool.query("SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 5");
    res.json(result.rows);
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
