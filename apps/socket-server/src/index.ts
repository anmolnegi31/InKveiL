import { createServer } from "http";
import { Server } from "socket.io";
import { handleChatEvents } from "./chat";
import { handleWebRTCEvents } from "./webrtc";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  handleChatEvents(io, socket);
  handleWebRTCEvents(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(8080, () => {
  console.log("Socket.IO server running on http://localhost:8080");
});
