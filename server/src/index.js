import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { apiReference } from "@scalar/express-api-reference";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not set. Using an insecure default for development."
  );
  process.env.JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
}
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";

const app = express();
const PORT = 3000;

connectDB();
app.use(
  "/api-reference",
  apiReference({
    spec: {
      url: "/openapi.json",
    },
    theme: "purple",
  })
);


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());


app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `API Reference available at http://localhost:${PORT}/api-reference`
  );
});
