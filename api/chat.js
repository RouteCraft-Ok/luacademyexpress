export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt, provider } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt' });
  }

  // Leer claves desde el servidor (Vercel las inyecta aquí)
  const keys = {
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    cohere: process.env.COHERE_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };

  // Si no se especifica proveedor, usar el primero disponible (cascada)
  const orden = ['groq', 'openrouter', 'gemini', 'mistral', 'cohere', 'huggingface'];
  const usar = provider || orden.find((p) => keys[p]);

  if (!usar || !keys[usar]) {
    return res.status(500).json({ error: 'No hay ninguna API key configurada' });
  }

  try {
    const respuesta = await llamarIA(usar, keys[usar], prompt);
    return res.status(200).json({ provider: usar, respuesta });
  } catch (err) {
    console.error(`Error con ${usar}:`, err);
    return res.status(500).json({ error: err.message, provider: usar });
  }
}

// Función que llama al proveedor correspondiente
async function llamarIA(provider, key, prompt) {
  switch (provider) {
    case 'groq': {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error Groq');
      return d.choices[0].message.content;
    }

    case 'openrouter': {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error OpenRouter');
      return d.choices[0].message.content;
    }

    case 'gemini': {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error Gemini');
      return d.candidates[0].content.parts[0].text;
    }

    case 'mistral': {
      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error Mistral');
      return d.choices[0].message.content;
    }

    case 'cohere': {
      const r = await fetch('https://api.cohere.com/v2/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'command-r-plus',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Error Cohere');
      return d.message.content[0].text;
    }

    case 'huggingface': {
      const r = await fetch(
        'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Error HuggingFace');
      return Array.isArray(d) ? d[0].generated_text : d.generated_text;
    }

    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}