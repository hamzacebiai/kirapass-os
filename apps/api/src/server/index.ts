import express from "express";
import healthRoutes from "../routes/health.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Routes
app.use("/api", healthRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log("?? KiraPass API running on http://localhost:" + PORT);
});
