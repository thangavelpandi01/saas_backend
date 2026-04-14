require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./db.connect");

const app = express();

// ======================
// ✅ CORS
// ======================
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ======================
// ✅ MIDDLEWARE
// ======================
app.use(express.json());

// ======================
// ✅ STATIC FILES (IMPORTANT FIX)
// ======================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// ✅ ROUTES
// ======================
app.get("/", (req, res) => {
  res.send("🚀 Server is running");
});

const userRoutes = require("./view/routing"); // FIX PATH (IMPORTANT)
app.use("/api/auth", userRoutes);

// ======================
// ✅ PORT
// ======================
const PORT = process.env.PORT || 3000;

// ======================
// ✅ START SERVER
// ======================
connectDB().then(() => {
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});