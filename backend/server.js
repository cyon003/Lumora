import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import operationsRoutes from "./routes/operationsRoutes.js";

const app = express();
const PORT = Number(process.env.PORT) || 5050;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", operationsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Lumora API",
  });
});

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});

server.on("error", (error) => {
  console.error("Server failed to start:", error);
});
