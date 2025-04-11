// server.js
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;


const ai = new GoogleGenAI({ apiKey: "AIzaSyASfbMJcB8dBzRkqKexl208YF8wfCMKe0Q" });


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.post('/generate', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
 
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: prompt,
      config: {
        responseModalities: ["Text", "Image"],
      },
    });

  
    if (process.env.NODE_ENV !== 'production') {
      console.log('Gemini API Response:', JSON.stringify(response, null, 2));
    }

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content) {
      return res.status(500).json({ error: 'No content received from API.' });
    }

    
    const parts = candidate.content.parts;
    let imageData = null;
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data;
        break;
      }
    }

    if (imageData) {
    
      const mimeType = "image/png"; 
      return res.json({ image: `data:${mimeType};base64,${imageData}` });
    } else {
     
      const textPart = parts.find(part => part.text);
      return res.status(200).json({ text: textPart ? textPart.text : 'No image generated.' });
    }
  } catch (error) {
    console.error("Error during Gemini API call:", error);
    return res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
