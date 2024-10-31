const { MongoClient } = require("mongodb");

const mongoUrl = "mongodb://localhost:27017";
const client = new MongoClient(mongoUrl);
let db;

const connectMongo = async () => {
  try {
    await client.connect();
    db = client.db("dice_game");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error("MongoDB not initialized");
  }
  return db;
};

module.exports = { connectMongo, getDb, client };
