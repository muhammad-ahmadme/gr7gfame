const { Pool } = require('pg');

// Use environment variables in Vercel settings for better security
const connectionString = process.env.DATABASE_URL || "postgresql://0552903361:6eF-3-CVc-Tmik-19bo0Og@doting-lioness-24499.j77.aws-ap-south-1.cockroachlabs.cloud:26257/defaultdb?sslmode=require";

const pool = new Pool({ 
    connectionString, 
    connectionTimeoutMillis: 5000,
    max: 10 // Limits total active connections to prevent CockroachDB overload
});

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') {
            // Fetch Leaderboard
            const scores = await pool.query("SELECT username, score FROM cyber_leaderboard ORDER BY score DESC LIMIT 10");
            
            // Fetch System State (Broadcast and Game Start)
            const sysState = await pool.query("SELECT broadcast_active, game_started FROM system_controls WHERE id = 1");
            
            return res.status(200).json({ 
                leaderboard: scores.rows, 
                broadcast: sysState.rows[0]?.broadcast_active || false,
                game_started: sysState.rows[0]?.game_started || false
            });
        }

        if (req.method === 'POST') {
            const { action, username, score, status } = req.body;
            
            // 1. Handle Admin Commands
            if (action === 'toggle_broadcast') {
                await pool.query("UPDATE system_controls SET broadcast_active = $1 WHERE id = 1", [status]);
                return res.status(200).json({ success: true });
            }

            if (action === 'toggle_game') {
                await pool.query("UPDATE system_controls SET game_started = $1 WHERE id = 1", [status]);
                return res.status(200).json({ success: true });
            }

            if (action === 'reset_scores') {
                await pool.query("TRUNCATE TABLE cyber_leaderboard");
                return res.status(200).json({ success: true });
            }

            // 2. Handle Student Score Submission
            if (username) {
                await pool.query(
                    `INSERT INTO cyber_leaderboard (username, score) 
                     VALUES ($1, $2) 
                     ON CONFLICT (username) 
                     DO UPDATE SET score = GREATEST(cyber_leaderboard.score, EXCLUDED.score)`,
                    [username, score]
                );
                return res.status(200).json({ success: true });
            }
        }
    } catch (err) {
        console.error("DB ERROR:", err.message);
        return res.status(500).json({ error: "Database failure", details: err.message });
    }
}
