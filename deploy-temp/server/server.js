const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "../client")));

// Game state
const gameState = {
  players: {},
  world: {},
  chunks: {},
};

// World generation - MUCH FASTER VERSION
function generateChunk(chunkX, chunkZ) {
  const CHUNK_SIZE = 16;
  const chunk = {};

  // Generate only a small platform for faster loading
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldZ = chunkZ * CHUNK_SIZE + z;

      // Simple flat world at Y=30 for fast loading
      const height = 30;

      // Only generate a few layers for speed
      for (let y = height - 2; y <= height; y++) {
        const key = `${worldX},${y},${worldZ}`;
        if (y === height) {
          chunk[key] = { type: "grass", x: worldX, y, z: worldZ };
        } else {
          chunk[key] = { type: "dirt", x: worldX, y, z: worldZ };
        }
      }
    }
  }

  return chunk;
}

// Get chunk key
function getChunkKey(x, z) {
  return `${Math.floor(x / 16)},${Math.floor(z / 16)}`;
}

// Load chunk if not exists
function loadChunk(chunkX, chunkZ) {
  const chunkKey = `${chunkX},${chunkZ}`;
  if (!gameState.chunks[chunkKey]) {
    gameState.chunks[chunkKey] = generateChunk(chunkX, chunkZ);
  }
  return gameState.chunks[chunkKey];
}

// Get blocks in range - MUCH SMALLER RANGE for fast loading
function getBlocksInRange(centerX, centerZ, range = 1) {
  const blocks = {};
  const startChunkX = Math.floor((centerX - range * 16) / 16);
  const endChunkX = Math.floor((centerX + range * 16) / 16);
  const startChunkZ = Math.floor((centerZ - range * 16) / 16);
  const endChunkZ = Math.floor((centerZ + range * 16) / 16);

  for (let chunkX = startChunkX; chunkX <= endChunkX; chunkX++) {
    for (let chunkZ = startChunkZ; chunkZ <= endChunkZ; chunkZ++) {
      const chunk = loadChunk(chunkX, chunkZ);
      Object.assign(blocks, chunk);
    }
  }

  return blocks;
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Initialize player
  const playerId = socket.id;
  gameState.players[playerId] = {
    id: playerId,
    x: 0,
    y: 35,
    z: 0,
    rotX: 0,
    rotY: 0,
    username: `Player${Math.floor(Math.random() * 1000)}`,
  };

  // Send initial game state - FAST LOADING with minimal blocks
  socket.emit("gameState", {
    playerId: playerId,
    players: gameState.players,
    blocks: getBlocksInRange(0, 0, 1), // Only 1 chunk for super fast loading
  });

  // Notify other players
  socket.broadcast.emit("playerJoined", gameState.players[playerId]);

  // Handle player movement
  socket.on("playerMove", (data) => {
    if (gameState.players[playerId]) {
      gameState.players[playerId].x = data.x;
      gameState.players[playerId].y = data.y;
      gameState.players[playerId].z = data.z;
      gameState.players[playerId].rotX = data.rotX;
      gameState.players[playerId].rotY = data.rotY;

      // Broadcast to other players
      socket.broadcast.emit("playerMoved", gameState.players[playerId]);

      // Send new chunks if needed
      const nearbyBlocks = getBlocksInRange(data.x, data.z, 2);
      socket.emit("chunkUpdate", nearbyBlocks);
    }
  });

  // Handle block placement
  socket.on("placeBlock", (data) => {
    const { x, y, z, type } = data;
    const key = `${x},${y},${z}`;
    const chunkKey = getChunkKey(x, z);

    if (!gameState.chunks[chunkKey]) {
      gameState.chunks[chunkKey] = {};
    }

    gameState.chunks[chunkKey][key] = { type, x, y, z };

    // Broadcast to all players
    io.emit("blockPlaced", { x, y, z, type });
  });

  // Handle block destruction
  socket.on("destroyBlock", (data) => {
    const { x, y, z } = data;
    const key = `${x},${y},${z}`;
    const chunkKey = getChunkKey(x, z);

    if (gameState.chunks[chunkKey] && gameState.chunks[chunkKey][key]) {
      delete gameState.chunks[chunkKey][key];

      // Broadcast to all players
      io.emit("blockDestroyed", { x, y, z });
    }
  });

  // Handle chat messages
  socket.on("chatMessage", (message) => {
    const player = gameState.players[playerId];
    if (player) {
      io.emit("chatMessage", {
        username: player.username,
        message: message,
        timestamp: Date.now(),
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);

    // Notify other players
    socket.broadcast.emit("playerLeft", playerId);

    // Remove player from game state
    delete gameState.players[playerId];
  });
});

server.listen(PORT, () => {
  console.log(`Minecraft server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to play!`);
});
