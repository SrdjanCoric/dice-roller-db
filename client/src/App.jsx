import { useState, useEffect } from "react";
import { Trophy, HistoryIcon, BarChart3 } from "lucide-react";
import axios from "axios";

const api = axios.create({
  baseURL: "", // Empty string will use relative URLs for both dev and prod
  timeout: 5000,
});

const Die = ({ value, isRolling }) => {
  const dots = {
    1: [[50, 50]],
    2: [
      [25, 25],
      [75, 75],
    ],
    3: [
      [25, 25],
      [50, 50],
      [75, 75],
    ],
    4: [
      [25, 25],
      [25, 75],
      [75, 25],
      [75, 75],
    ],
    5: [
      [25, 25],
      [25, 75],
      [50, 50],
      [75, 25],
      [75, 75],
    ],
    6: [
      [25, 25],
      [25, 50],
      [25, 75],
      [75, 25],
      [75, 50],
      [75, 75],
    ],
  };

  return (
    <div
      className={`relative w-24 h-24 bg-white rounded-2xl shadow-lg transform-gpu
        ${isRolling ? "animate-roll" : "hover:scale-105 transition-transform"}
        perspective-1000`}
      style={{
        transformStyle: "preserve-3d",
        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
      }}
    >
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {dots[value].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="8"
              fill="#2563eb"
              className="transform transition-transform"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

const GameStats = ({ stats }) => (
  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2 mb-4">
      <BarChart3 className="text-white" size={24} />
      <h3 className="text-lg font-bold text-white">Game Statistics</h3>
    </div>
    <div className="grid grid-cols-2 gap-4 text-white">
      <div>Total Games: {stats.totalGames}</div>
      <div>Player Win Rate: {stats.playerWinRate}%</div>
      <div>Player Wins: {stats.playerWins}</div>
      <div>Computer Wins: {stats.computerWins}</div>
      <div>Ties: {stats.ties}</div>
    </div>
  </div>
);

const GameHistory = ({ history }) => (
  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm mt-4">
    <div className="flex items-center gap-2 mb-4">
      <HistoryIcon className="text-white" size={24} />
      <h3 className="text-lg font-bold text-white">Recent Games</h3>
    </div>
    <div className="space-y-2">
      {history.map((game, index) => (
        <div key={index} className="text-white text-sm">
          {new Date(game.timestamp).toLocaleString()}:
          {game.winner === "tie" ? " Tie Game " : ` ${game.winner} won `}(
          {game.playerScore} vs {game.computerScore})
        </div>
      ))}
    </div>
  </div>
);

const App = () => {
  const [playerDice, setPlayerDice] = useState([1, 1]);
  const [computerDice, setComputerDice] = useState([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/api/games/stats");
      setGameStats(data);
      setError(null);
    } catch (error) {
      setError("Failed to fetch game statistics");
      console.error("Error fetching stats:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get("/api/games/history");
      setGameHistory(data);
      setError(null);
    } catch (error) {
      setError("Failed to fetch game history");
      console.error("Error fetching history:", error);
    }
  };
  const startGame = async () => {
    try {
      const { data } = await api.post("/api/games/start");
      setCurrentGameId(data.gameId);
      setError(null);
    } catch (error) {
      setError("Failed to start new game");
      console.error("Error starting game:", error);
    }
  };

  useEffect(() => {
    startGame();
    fetchStats();
    fetchHistory();
  }, []);

  const resetGame = async () => {
    setIsRolling(false);
    setWinner(null);
    setError(null);
    try {
      const { data } = await api.post("/api/games/reset");
      setCurrentGameId(data.gameId);
      setPlayerDice([1, 1]);
      setComputerDice([1, 1]);

      setGameStats({
        totalGames: 0,
        playerWins: 0,
        computerWins: 0,
        ties: 0,
        playerWinRate: 0,
      });
    } catch (error) {
      setError("Failed to reset game");
      console.error("Error resetting game:", error);
    }
  };

  const rollDice = async () => {
    setIsRolling(true);
    setWinner(null);
    setError(null);
    try {
      const { data } = await api.post("/api/games/roll", {
        gameId: currentGameId,
      });

      setTimeout(() => {
        setPlayerDice(data.playerDice);
        setComputerDice(data.computerDice);
        setWinner(data.winner);
        setIsRolling(false);
        fetchStats();
        fetchHistory();
      }, 1000);
    } catch (error) {
      setError("Failed to roll dice");
      console.error("Error rolling dice:", error);
      setIsRolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-white mb-2 tracking-wider">
          Capstone 2505
        </h1>
        <h2 className="text-4xl font-semibold text-blue-100">Dice Roller</h2>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-4 p-4 bg-red-500/80 text-white rounded-lg text-center">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-white/20 backdrop-blur-lg rounded-xl p-8 shadow-xl">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Player</h3>
              <div className="flex justify-center gap-6">
                {playerDice.map((value, index) => (
                  <Die
                    key={`player-${index}`}
                    value={value}
                    isRolling={isRolling}
                  />
                ))}
              </div>
              <p className="text-xl text-white mt-4 font-semibold">
                Total: {playerDice.reduce((a, b) => a + b)}
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Computer</h3>
              <div className="flex justify-center gap-6">
                {computerDice.map((value, index) => (
                  <Die
                    key={`computer-${index}`}
                    value={value}
                    isRolling={isRolling}
                  />
                ))}
              </div>
              <p className="text-xl text-white mt-4 font-semibold">
                Total: {computerDice.reduce((a, b) => a + b)}
              </p>
            </div>
          </div>

          {winner && (
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 text-2xl font-bold text-yellow-300">
                <Trophy />
                {winner === "tie"
                  ? "It's a Tie!"
                  : `${winner === "player" ? "Player" : "Computer"} Wins!`}
                <Trophy />
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <button
              onClick={rollDice}
              disabled={isRolling}
              className="px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold rounded-full text-xl mr-4
                transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl"
            >
              {isRolling ? "Rolling..." : "Roll Dice!"}
            </button>
            <button
              onClick={resetGame}
              disabled={isRolling}
              className="px-8 py-4 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-full text-xl
        transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg hover:shadow-xl"
            >
              Reset Game
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {gameStats && <GameStats stats={gameStats} />}
          {gameHistory.length > 0 && <GameHistory history={gameHistory} />}
        </div>
      </div>
    </div>
  );
};

export default App;
