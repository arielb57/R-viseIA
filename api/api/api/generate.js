export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { topic, level, format, details } = req.body || {};
    if (!topic) return res.status(400).json({ error: "Missing topic" });

    const prompt = `
Tu es un prof. Génère une fiche de révision claire et structurée + un quiz.
Thème: ${topic}
Niveau: ${level || "Lycée"}
Format: ${format || "Fiche + Quiz"}
Consignes: ${details || "—"}

Contraintes:
- FICHE: titres, définitions, points clés, 1-2 exemples
- QUIZ: 8 questions (4 QCM + 4 questions ouvertes) avec corrigé à la fin
- Réponse en français, très lisible.
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
    if (!r.ok) return res.status(r.status).json(data);

    const text = data.output_text ?? JSON.stringify(data);
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
}
