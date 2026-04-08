const { Pool } = require('pg');

const connectionString = "postgresql://0552903361:6eF-3-CVc-Tmik-19bo0Og@doting-lioness-24499.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require";

const pool = new Pool({ 
    connectionString,
    connectionTimeoutMillis: 5000 
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'POST') {
            const { username, score } = req.body;
            await pool.query(
                "INSERT INTO cyber_leaderboard (username, score) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET score = GREATEST(cyber_leaderboard.score, EXCLUDED.score), last_updated = now()",
                [username, score]
            );
            return res.status(200).json({ success: true });
        }

        if (req.method === 'GET') {
            const result = await pool.query("SELECT username, score FROM cyber_leaderboard ORDER BY score DESC LIMIT 10");
            return res.status(200).json(result.rows);
        }
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        return res.status(500).json({ error: err.message });
    }
}
