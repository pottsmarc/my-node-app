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

  /////////////////////new line of code/////////////////////////////////

socket.on("get_class_roster", async (data) => {

  console.log("================================");
  console.log("ROSTER REQUEST RECEIVED");
  console.log("Socket:", socket.id);
  console.log("Requested class:", data?.classId);

  try {

    const classId = String(data?.classId || "").trim();

    if (!classId) {
      throw new Error("Missing classId.");
    }

    // Check environment variables.
    if (!process.env.APPS_SCRIPT_URL) {
      throw new Error("APPS_SCRIPT_URL is missing.");
    }

    if (!process.env.APPS_SCRIPT_KEY) {
      throw new Error("APPS_SCRIPT_KEY is missing.");
    }

    console.log("Apps Script URL found.");

    // Construct Apps Script request.
    const url = new URL(process.env.APPS_SCRIPT_URL);

    url.searchParams.set(
      "key",
      process.env.APPS_SCRIPT_KEY
    );

    console.log("Requesting Google Apps Script...");

    const response = await fetch(url);

    console.log("Apps Script HTTP status:", response.status);

    if (!response.ok) {
      throw new Error(
        "Apps Script HTTP error: " + response.status
      );
    }

    // const roster = await response.json();
    
const contentType = response.headers.get("content-type");

console.log("HTTP STATUS:", response.status);
console.log("CONTENT TYPE:", contentType);

// Do not log the query string because it contains your API key.
console.log(
  "FINAL RESPONSE URL:",
  response.url.split("?")[0]
);

const responseText = await response.text();

console.log(
  "RAW GOOGLE RESPONSE:",
  responseText.substring(0, 1500)
);

let roster;

try {
  roster = JSON.parse(responseText);
} catch (error) {
  throw new Error(
    "Google returned HTML or invalid JSON. " +
    "Content-Type: " + contentType +
    ". Response begins: " +
    responseText.substring(0, 300)
  );
}
//////////////////////////end of test///////////////////////////////////////

    console.log("Apps Script response received.");

    if (roster.error) {
      throw new Error(roster.error);
    }

    if (!Array.isArray(roster.students)) {
      throw new Error(
        "Expected roster.students to be an array."
      );
    }

    console.log(
      "Total students returned by Apps Script:",
      roster.students.length
    );

    // Filter students by classroom.
    const students = roster.students

      .filter(student =>
        String(student.ClassID || "").trim() === classId
      )

      .map(student => ({
        markerId: Number(student.MarkerID),
        MarkerID: Number(student.MarkerID),
        StudentName: student.StudentName
      }));

    console.log(
      "Students matching class:",
      students.length
    );

    // Send roster to requesting scanner.
    socket.emit("class_roster", {
      classId: classId,
      students: students
    });

    console.log(
      "SUCCESS: Roster sent to socket:",
      socket.id
    );

    console.log("================================");

  } catch (error) {

    console.error("ROSTER ERROR:", error);

    socket.emit("roster_error", {
      message: error.message
    });

  }

});///////////////end of new line of code
});

app.get("/", (req, res) => {
  res.send("Server is working!");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const port = process.env.PORT || 3000;
// app.listen(port, '0.0.0.0', () => {
//   console.log(`Server running on port ${port}`);
// });
