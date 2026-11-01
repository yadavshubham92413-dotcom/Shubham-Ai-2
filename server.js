const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));

// Environment configuration
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

// Check required configuration
if (!API_KEY || !MODEL) {
console.error("Missing OPENAI_API_KEY or OPENAI_MODEL");
process.exit(1);
}

// Allow only the deployed frontend
app.use(cors({
origin: function (origin, callback) {
if (!origin || origin === FRONTEND_ORIGIN) {
return callback(null, true);
}

    return callback(new Error("Origin not allowed"));
}

}));

const openai = new OpenAI({
apiKey: API_KEY
});

// Basic per-IP rate limit
const requests = new Map();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;

app.use("/chat", (req, res, next) => {
const ip = req.ip;
const now = Date.now();

let record = requests.get(ip);

if (!record || now - record.start > WINDOW_MS) {
    record = { start: now, count: 0 };
}

record.count++;
requests.set(ip, record);

if (record.count > RATE_LIMIT) {
    return res.status(429).json({
        error: "Too many requests. Please wait one minute."
    });
}

next();

});

// Health check
app.get("/", (req, res) => {
res.json({
status: "online",
name: "SHUBHAM AI Backend"
});
});

// AI chat endpoint
app.post("/chat", async (req, res) => {
try {
const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
            error: "A valid message is required."
        });
    }

    if (message.length > 12000) {
        return res.status(400).json({
            error: "Message is too long."
        });
    }

    const response = await openai.responses.create({
        model: MODEL,
        input: message.trim()
    });

    res.json({
        reply: response.output_text || ""
    });

} catch (error) {
    console.error("AI Error:", error.message);

    res.status(500).json({
        error: "SHUBHAM AI could not generate a response."
    });
}

});

// General error handler
app.use((err, req, res, next) => {
console.error("Server Error:", err.message);

res.status(500).json({
    error: "Server error."
});

});

app.listen(PORT, "0.0.0.0", () => {
console.log("SHUBHAM AI Backend Running!");
console.log("Port:", PORT);
});
