import { Server, Socket } from "socket.io";

export function handleChatEvents(io: Server, socket: Socket) {
  socket.on("chat:message", (data) => {
    // Broadcast to all users
    io.emit("chat:message", {
      text: data.text,
      from: socket.id
    });
  });
}
