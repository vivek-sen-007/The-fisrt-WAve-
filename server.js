import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());

// ===============================
// SERVE FRONTEND
// ===============================

// Your index.html, styles.css and app.js
// are one folder above the server folder.

const frontendPath = path.join(__dirname, "..");

app.use(express.static(frontendPath));

// ===============================
// HOME PAGE
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "SafeRoute AI backend is running",
        llmConfigured: Boolean(process.env.OPENAI_API_KEY),
        model: process.env.OPENAI_MODEL || "not configured"
    });
});

// ===============================
// AI ROUTE ANALYSIS
// ===============================

app.post("/api/analyze-route", async (req, res) => {

    try {

        // Check API key
        if (!process.env.OPENAI_API_KEY) {

            return res.status(500).json({
                success: false,
                error: "OPENAI_API_KEY is missing in server/.env"
            });

        }

        const {
            origin,
            destination,
            mode,
            travelTime,
            routeA,
            routeB,
            selectedRoute,
            hazards
        } = req.body;

        // Basic validation
        if (!origin || !destination) {

            return res.status(400).json({
                success: false,
                error: "Origin and destination are required."
            });

        }

        // ===============================
        // CREATE AI PROMPT
        // ===============================

        const prompt = `
You are SafeRoute AI, a safety-focused route analysis assistant.

Your job is to analyze two possible routes and recommend the safer route.

IMPORTANT:
- Safety is more important than small differences in travel time.
- Consider incident risk, road quality, lighting, time of day, travel mode and hazards.
- Do NOT invent real-world incidents.
- Only use the information provided below.
- Give a concise recommendation suitable for a navigation dashboard.

TRIP INFORMATION

Origin:
${origin}

Destination:
${destination}

Travel mode:
${mode || "car"}

Travel time:
${travelTime || "day"}

ROUTE A:
${JSON.stringify(routeA, null, 2)}

ROUTE B:
${JSON.stringify(routeB, null, 2)}

CURRENTLY SELECTED ROUTE:
${JSON.stringify(selectedRoute, null, 2)}

COMMUNITY HAZARDS:
${JSON.stringify(hazards || [], null, 2)}

Return ONLY valid JSON in exactly this format:

{
  "recommendation": "Route A or Route B",
  "riskLevel": "Low, Medium, or High",
  "reason": "Short explanation of why this route is safer.",
  "factors": [
    "Factor 1",
    "Factor 2",
    "Factor 3"
  ]
}
`;

        // ===============================
        // OPENAI RESPONSES API
        // ===============================

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
                },

                body: JSON.stringify({

                    model:
                        process.env.OPENAI_MODEL ||
                        "gpt-6-luna",

                    input: [
                        {
                            role: "system",
                            content:
                                "You are a safety-first navigation AI. Return concise, factual JSON."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]

                })
            }
        );

        // ===============================
        // HANDLE OPENAI ERROR
        // ===============================

        if (!response.ok) {

            const errorText = await response.text();

            console.error("OpenAI API error:", errorText);

            return res.status(response.status).json({
                success: false,
                error: "LLM API request failed.",
                details: errorText
            });
        }

        const data = await response.json();

        // ===============================
        // GET AI TEXT
        // ===============================

        let aiText = data.output_text;

        // Fallback if output_text isn't available
        if (!aiText && data.output) {

            for (const item of data.output) {

                if (item.type === "message" && item.content) {

                    for (const content of item.content) {

                        if (content.type === "output_text") {
                            aiText = content.text;
                            break;
                        }
                    }
                }

                if (aiText) break;
            }
        }

        if (!aiText) {

            console.error("No AI text returned:", data);

            return res.status(500).json({
                success: false,
                error: "The LLM returned no text."
            });
        }

        // ===============================
        // CLEAN JSON
        // ===============================

        aiText = aiText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        let result;

        try {

            result = JSON.parse(aiText);

        } catch (jsonError) {

            console.error("Could not parse AI JSON:", aiText);

            // Safe fallback
            result = {
                recommendation: "Route B",
                riskLevel: "Medium",
                reason: aiText,
                factors: [
                    "AI response received",
                    "Review route safety metrics",
                    "Check current hazards"
                ]
            };
        }

        // ===============================
        // SEND RESULT TO FRONTEND
        // ===============================

        res.json({
            success: true,
            recommendation: result.recommendation || "Route B",
            riskLevel: result.riskLevel || "Medium",
            reason: result.reason || "No reason provided.",
            factors: Array.isArray(result.factors)
                ? result.factors
                : []
        });

    } catch (error) {

        console.error("Server error:", error);

        res.status(500).json({
            success: false,
            error: "Server error while analyzing route.",
            details: error.message
        });
    }
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log("       SafeRoute AI SERVER");
    console.log("======================================");
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Health:   http://localhost:${PORT}/api/health`);
    console.log(`AI API:   http://localhost:${PORT}/api/analyze-route`);
    console.log("======================================");
    console.log("");

});