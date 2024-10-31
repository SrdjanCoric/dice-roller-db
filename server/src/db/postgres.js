const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: "dice_game",
  password: process.env.PG_PASSWORD,
  port: 5432,
});

const initializePostgres = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS current_game (
        id VARCHAR(255) PRIMARY KEY,
        status VARCHAR(50),
        timestamp TIMESTAMP,
        player_score INTEGER DEFAULT 0,
        computer_score INTEGER DEFAULT 0,
        winner VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS current_session (
        id INTEGER PRIMARY KEY DEFAULT 1,
        total_games INTEGER DEFAULT 0,
        player_wins INTEGER DEFAULT 0,
        computer_wins INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      INSERT INTO current_session (id, total_games, player_wins, computer_wins, ties)
      VALUES (1, 0, 0, 0, 0)
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch (error) {
    console.error("PostgreSQL initialization error:", error);
    throw error;
  }
};

module.exports = { pool, initializePostgres };
