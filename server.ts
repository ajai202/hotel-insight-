import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as ss from "simple-statistics";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Hotel Income & Expense System API" });
  });

  // Prediction API
  // Expects { data: { x: number, y: number }[] } where x is time index, y is amount
  app.post("/api/predict", (req, res) => {
    try {
      const { data } = req.body;
      if (!data || !Array.isArray(data) || data.length < 2) {
        return res.status(400).json({ error: "Insufficient data for prediction" });
      }

      const points = data.map((d: any) => [d.x, d.y]);
      const regression = ss.linearRegression(points);
      const line = ss.linearRegressionLine(regression);

      // Predict next point (x_max + 1)
      const x_max = Math.max(...data.map((d: any) => d.x));
      const next_x = x_max + 1;
      const predicted_y = line(next_x);

      res.json({
        next_x,
        predicted_y,
        m: regression.m,
        b: regression.b
      });
    } catch (error) {
      console.error("Prediction error:", error);
      res.status(500).json({ error: "Prediction failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
