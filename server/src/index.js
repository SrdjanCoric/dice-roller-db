const express = require("express");
const cors = require("cors");
const { initializePostgres, pool } = require("./db/postgres");
const { connectMongo, client } = require("./db/mongodb");
const gamesRouter = require("./routes/api");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/games", gamesRouter);

async function startServer() {
  try {
    await initializePostgres();
    await connectMongo();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  try {
    await client.close();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

startServer();
