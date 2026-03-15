import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors, { CorsOptions } from "cors";
 
import pipeLineRouter from "./routes/pipeline.routes";
import projectRouter from "./routes/projects.routes";

dotenv.config();

const app = express();

const PORT =
  Number(process.env.PORT) || Number(process.env.TASKMINDS_APP_PORT) || 5000;

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  process.env.TASKMINDS_APP_DATABASE_URL;

const ALLOWED_ORIGINS = (
  process.env.TASKMINDS_APP_CORS_ORIGINS || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS not allowed for this origin"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

/*
-----------------------------------
Middleware
-----------------------------------
*/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/*
-----------------------------------
HTTP + Socket Server
-----------------------------------
*/

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

/*
-----------------------------------
Socket Connection
-----------------------------------
*/

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (room: string) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/*
-----------------------------------
Routes
-----------------------------------
*/

app.use("/api/v1", projectRouter);
app.use("/api/v1", pipeLineRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/*
-----------------------------------
Error Middleware
-----------------------------------
*/

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
});

/*
-----------------------------------
Bootstrap Server
-----------------------------------
*/

const bootstrap = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("Mongo URI missing. Set MONGO_URI or DATABASE_URL");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
      console.log(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void bootstrap();
