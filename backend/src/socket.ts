import { io } from "./server";

export const sendProgress = (room: string, message: string, data?: any) => {
  io.to(room).emit("pipeline-progress", {
    message,
    data,
    time: new Date(),
  });
};
