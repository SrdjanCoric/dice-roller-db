const express = require("express");
const router = express.Router();
const { pool } = require("../db/postgres");
const { getDb } = require("../db/mongodb");

router.post("/start", async (req, res) => {
  try {
    const gameId = Date.now().toString();
    await pool.query(
      "INSERT INTO current_game (id, status, timestamp, player_score, computer_score) VALUES ($1, $2, $3, $4, $5)",
      [gameId, "started", new Date(), 0, 0]
    );
    res.json({ gameId });
  } catch (error) {
    res.status(500).json({ error: "Failed to start game" });
  }
});

router.post("/reset", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const gameResult = await client.query("SELECT * FROM current_game");
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "No active game found" });
    }

    await client.query(`
      UPDATE current_session
      SET total_games = 0, player_wins = 0, computer_wins = 0, ties = 0
      WHERE id = 1
    `);

    const gameId = Date.now().toString();
    await client.query(
      "INSERT INTO current_game (id, status, timestamp, player_score, computer_score) VALUES ($1, $2, $3, $4, $5)",
      [gameId, "started", new Date(), 0, 0]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      gameId,
      stats: { totalGames: 0, playerWins: 0, computerWins: 0, ties: 0 },
      message: "Game reset successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to reset game" });
  } finally {
    client.release();
  }
});

router.post("/roll", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const gameResult = await client.query("SELECT * FROM current_game");
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "No active game found" });
    }

    const playerDice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];
    const computerDice = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];

    const playerTotal = playerDice.reduce((a, b) => a + b);
    const computerTotal = computerDice.reduce((a, b) => a + b);

    let winner;
    if (playerTotal > computerTotal) {
      winner = "player";
      await client.query(
        "UPDATE current_session SET total_games = total_games + 1, player_wins = player_wins + 1 WHERE id = 1"
      );
    } else if (computerTotal > playerTotal) {
      winner = "computer";
      await client.query(
        "UPDATE current_session SET total_games = total_games + 1, computer_wins = computer_wins + 1 WHERE id = 1"
      );
    } else {
      winner = "tie";
      await client.query(
        "UPDATE current_session SET total_games = total_games + 1, ties = ties + 1 WHERE id = 1"
      );
    }

    const currentGame = gameResult.rows[0];
    await client.query(
      "UPDATE current_game SET status = $1, player_score = $2, computer_score = $3, winner = $4 WHERE id = $5",
      ["completed", playerTotal, computerTotal, winner, currentGame.id]
    );

    const db = getDb();
    await db.collection("game_history").insertOne({
      id: currentGame.id,
      timestamp: new Date(),
      winner: winner,
      playerScore: playerTotal,
      computerScore: computerTotal,
      playerDice: playerDice,
      computerDice: computerDice,
    });

    await client.query("COMMIT");

    res.json({
      playerDice,
      computerDice,
      winner,
      playerTotal,
      computerTotal,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to process roll" });
  } finally {
    client.release();
  }
});

router.get("/history", async (req, res) => {
  try {
    const db = getDb();
    const history = await db
      .collection("game_history")
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch game history" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM current_session WHERE id = 1"
    );
    const currentSession = result.rows[0];

    res.json({
      totalGames: currentSession.total_games,
      playerWins: currentSession.player_wins,
      computerWins: currentSession.computer_wins,
      ties: currentSession.ties,
      playerWinRate: currentSession.total_games
        ? (
            (currentSession.player_wins / currentSession.total_games) *
            100
          ).toFixed(1)
        : 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

module.exports = router;
