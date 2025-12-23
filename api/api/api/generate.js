export default async function handler(req, res) {
  // CORS (au cas où)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { topic, level, format, details } = req.body || {};
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const prompt = `
Tu es un excellent professeur. Génère un contenu en FRANÇAIS.

THEME: ${topic}
NIVEAU: ${level || "Lycée"}
FORMAT: ${format || "Fiche + Quiz"}
CONSIGNES: ${details || "—"}

Règles:
- Le contenu doit porter uniquement sur "${topic}"
- Structure claire: TITRES, puces, exemples
- Si "Fiche + Quiz": fiche puis quiz puis corrigé
- Quiz: 8 questions (4 QCM + 4 ouvertes) + corrigé
`.trim();

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({
        error: data?.error?.message || "OpenAI API error",
        details: data,
      });
    }

    return res.status(200).json({ text: data.output_text || "" });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
}
