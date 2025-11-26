// server/imgurProxy.js
// Simple Express proxy that forwards Base64 images to Imgur.
// It receives a JSON body { base64Data: "data:image/..." } and returns { link: "https://i.imgur.com/xxxx.png" }.

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config(); // loads .env at project root

const app = express();
app.use(cors()); // default allows any origin – Vite dev server runs on localhost:5173
app.use(express.json({ limit: "50mb" })); // Imgur limit is 10 MB, give some headroom

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || "1598cfe786e48f0"; // fallback for safety
const IMGUR_API_ENDPOINT = "https://api.imgur.com/3/image";

app.post("/api/imgur-upload", async (req, res) => {
    try {
        const { base64Data } = req.body;
        if (!base64Data) {
            return res.status(400).json({ error: "No image provided" });
        }

        // Strip the data URI prefix (e.g. "data:image/png;base64,")
        const base64Image = base64Data.split(",")[1];
        if (!base64Image) {
            return res.status(400).json({ error: "Invalid base64 data" });
        }

        const form = new FormData();
        form.append("image", base64Image);

        const response = await fetch(IMGUR_API_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
                // node-fetch will set appropriate multipart headers from FormData
            },
            body: form,
        });

        const data = await response.json();
        if (!response.ok) {
            // Forward Imgur error details to the client
            return res.status(response.status).json(data);
        }

        // Successful upload – return only the image link
        return res.json({ link: data.data.link });
    } catch (err) {
        console.error("Proxy error:", err);
        return res.status(500).json({ error: "Imgur upload failed", detail: err.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Imgur proxy running on port ${PORT}`));
