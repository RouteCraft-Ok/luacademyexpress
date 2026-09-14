export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { messages, systemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

  const keys = {
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    cohere: process.env.COHERE_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };

  const orden = ['groq', 'openrouter', 'gemini', 'mistral', 'cohere', 'huggingface'];
  const errores = [];

  for (const provider of orden) {
    if (!keys[provider]) continue;

    try {
      const respuesta = await llamarIA(
        provider,
        keys[provider],
        messages,
        systemPrompt
      );
      return res.status(200).json({ provider, respuesta });
    } catch (err) {
      console.warn(`[chat.js] ${provider} falló:`, err.message);
      errores.push(`${provider}: ${err.message}`);
    }
  }

  return res.status(500).json({
    error: 'Ninguna IA respondió. ' + errores.join(' | ')
  });
}

async function llamarIA(provider, key, messages, systemPrompt) {
  // Mensajes en formato OpenAI (system + historial)
  const openAIMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content }))
  ];

  switch (provider) {
    case 'groq': {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: openAIMessages,
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
          'HTTP-Referer': 'https://levelup-academy.vercel.app',
          'X-Title': 'LevelUp Academy',
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: openAIMessages,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error OpenRouter');
      return d.choices[0].message.content;
    }

    case 'gemini': {
      const contents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents,
          }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error Gemini');
      return d.candidates[0].content.parts.map((p) => p.text).join('');
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
          messages: openAIMessages,
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
          model: 'command-a-plus-05-2026',
          messages: openAIMessages,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Error Cohere');
      return d.message.content.map((c) => c.text).join('');
    }

    case 'huggingface': {
      const r = await fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b:fastest',
            messages: openAIMessages,
          }),
        }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error HuggingFace');
      return d.choices[0].message.content;
    }

    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}