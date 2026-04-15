// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
// const io = new Server(server);
// const io = new Server(server, {
//   cors: { origin: "*" }
// });
const io = new Server(server, {
  cors: {
    origin: "*",   // or your frontend URL
    methods: ["GET", "POST"]
  }
});

// Serve static files if needed
app.use(express.static("public"));

// Listen for WebSocket connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Receive an action from one client
  socket.on("action", (data) => {
    console.log("Action received:", data);

    // Broadcast to all other clients
    socket.broadcast.emit("action", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Server is working!");
});

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
