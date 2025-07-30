import { Server, Socket } from "socket.io";

export function handleWebRTCEvents(io: Server, socket: Socket) {
  socket.on("webrtc:offer", (data) => {
    socket.to(data.to).emit("webrtc:offer", {
      from: socket.id,
      offer: data.offer
    });
  });

  socket.on("webrtc:answer", (data) => {
    socket.to(data.to).emit("webrtc:answer", {
      from: socket.id,
      answer: data.answer
    });
  });

  socket.on("webrtc:candidate", (data) => {
    socket.to(data.to).emit("webrtc:candidate", {
      from: socket.id,
      candidate: data.candidate
    });
  });
}
