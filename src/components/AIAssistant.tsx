
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  selectedCourse?: any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  selectedCourse
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  /*
   * Curso actualmente activo.
   *
   * Cuando el usuario entra a un curso:
   * selectedCourse contiene el curso.
   *
   * Cuando sale del curso:
   * selectedCourse debería pasar a null/undefined
   * y activeCourse se limpia automáticamente.
   */
  const [activeCourse, setActiveCourse] = useState<any>(
    selectedCourse ?? null
  );

  useEffect(() => {
    setActiveCourse(selectedCourse ?? null);
  }, [selectedCourse]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedChat = localStorage.getItem(
        'levelup_chat_history'
      );

      if (savedChat) {
        return JSON.parse(savedChat);
      }
    } catch (error) {
      console.warn(
        'No se pudo cargar el historial:',
        error
      );
    }

    return [
      {
        role: 'assistant',
        content:
          '¡Hola! Soy LevelUp AI. ¿En qué puedo ayudarte con tus estudios hoy?'
      }
    ];
  });

  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        'levelup_chat_history',
        JSON.stringify(messages)
      );
    } catch (error) {
      console.warn(
        'No se pudo guardar el historial:',
        error
      );
    }

    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  const clearChat = () => {
    const initialMessage: ChatMessage[] = [
      {
        role: 'assistant',
        content:
          '¡Hola de nuevo! He limpiado el historial. ¿Qué nueva duda tienes?'
      }
    ];

    setMessages(initialMessage);
    localStorage.removeItem(
      'levelup_chat_history'
    );
  };

  /**
   * Hace una petición con timeout.
   */
  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs = 15000
  ): Promise<Response> => {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  /**
   * Obtiene el cuerpo de un error.
   */
  const getErrorBody = async (
    res: Response
  ): Promise<string> => {
    try {
      const text = await res.text();

      if (!text) {
        return '';
      }

      try {
        const json = JSON.parse(text);
        return JSON.stringify(json);
      } catch {
        return text;
      }
    } catch {
      return '';
    }
  };

  /**
   * Registra errores sin detener la cascada.
   */
  const logProviderError = async (
    provider: string,
    res: Response
  ) => {
    const body = await getErrorBody(res);

    console.warn(
      `[LevelUp AI] ❌ ${provider} falló`,
      `HTTP ${res.status}`,
      body || '(sin cuerpo de respuesta)'
    );
  };

  const fetchAIWithFullCascade = async (
    allMessages: ChatMessage[]
  ): Promise<string> => {
    /*
     * IMPORTANTE:
     * Usamos activeCourse y no selectedCourse directamente.
     *
     * Si el usuario salió del curso, activeCourse será null
     * y la IA recibirá explícitamente que no hay curso activo.
     */
    const systemPrompt = `Eres el asistente de LevelUp Academy.

Eres un experto programador y profesor de programación.

Responde siempre en español.

Usa Markdown cuando sea útil.

Explica los conceptos de programación de forma clara y práctica.

Si el usuario pregunta por código, proporciona ejemplos completos y correctos.

No inventes APIs, funciones o documentación.

${
  activeCourse
    ? `El usuario actualmente está viendo el curso: "${activeCourse.title}".
Descripción del curso: "${activeCourse.description}".`
    : 'El usuario no está viendo ningún curso actualmente. No asumas que está dentro de un curso específico.'
}`;

    /**
     * Historial compatible con APIs OpenAI-style.
     */
    const formattedOpenAIStyle = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...allMessages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    // ============================================================
    // 1. GROQ
    // ============================================================

    const groqKey =
      import.meta.env.VITE_GROQ_API_KEY;

    if (groqKey?.trim()) {
      try {
        console.log(
          '[LevelUp AI] 🔵 Probando Groq...'
        );

        const res = await fetchWithTimeout(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'openai/gpt-oss-120b',
              messages: formattedOpenAIStyle,
              temperature: 0.7,
              max_tokens: 2048
            })
          }
        );

        if (res.ok) {
          const data = await res.json();

          const text =
            data?.choices?.[0]?.message?.content;

          if (text) {
            console.log(
              '[LevelUp AI] ✅ Groq respondió correctamente'
            );

            return text;
          }

          console.warn(
            '[LevelUp AI] ⚠️ Groq respondió pero no devolvió texto'
          );
        } else {
          await logProviderError(
            'Groq',
            res
          );
        }
      } catch (error) {
        console.warn(
          '[LevelUp AI] ❌ Groq excepción:',
          error
        );
      }
    } else {
      console.warn(
        '[LevelUp AI] ⚠️ Groq omitido: VITE_GROQ_API_KEY no configurada'
      );
    }

    // ============================================================
    // 2. OPENROUTER
    // ============================================================

    const openRouterKey =
      import.meta.env.VITE_OPENROUTER_API_KEY;

    console.log(
      '[LevelUp AI] 🔎 OpenRouter key:',
      openRouterKey
        ? `${openRouterKey.substring(0, 8)}...`
        : 'NO EXISTE'
    );

    if (openRouterKey?.trim()) {
      try {
        console.log(
          '[LevelUp AI] 🟣 Probando OpenRouter...'
        );

        const res = await fetchWithTimeout(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openRouterKey.trim()}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': window.location.origin,
              'X-Title': 'LevelUp Academy'
            },
            body: JSON.stringify({
              model: 'openrouter/free',
              messages: formattedOpenAIStyle,
              temperature: 0.7,
              max_tokens: 2048,
              stream: false
            })
          }
        );

        if (res.ok) {
          const data = await res.json();

          console.log(
            '[LevelUp AI] 🟣 Respuesta OpenRouter:',
            data
          );

          const text =
            data?.choices?.[0]?.message?.content;

          if (text) {
            console.log(
              '[LevelUp AI] ✅ OpenRouter respondió correctamente'
            );

            return text;
          }

          console.warn(
            '[LevelUp AI] ⚠️ OpenRouter respondió pero no devolvió texto'
          );
        } else {
          await logProviderError(
            'OpenRouter',
            res
          );
        }
      } catch (error) {
        console.warn(
          '[LevelUp AI] ❌ OpenRouter excepción:',
          error
        );
      }
    } else {
      console.warn(
        '[LevelUp AI] ⚠️ OpenRouter omitido: API key no configurada'
      );
    }

    // ============================================================
    // 3. GEMINI
    // ============================================================

    const geminiKey =
      import.meta.env.VITE_GEMINI_API_KEY;

    if (geminiKey?.trim()) {
      try {
        console.log(
          '[LevelUp AI] 🟢 Probando Gemini...'
        );

        const geminiContents =
          allMessages.map((m) => ({
            role:
              m.role === 'assistant'
                ? 'model'
                : 'user',
            parts: [
              {
                text: m.content
              }
            ]
          }));

        const res = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [
                  {
                    text: systemPrompt
                  }
                ]
              },

              contents: geminiContents,

              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
              }
            })
          }
        );

        if (res.ok) {
          const data = await res.json();

          const text =
            data?.candidates?.[0]?.content?.parts
              ?.map(
                (part: any) =>
                  part?.text || ''
              )
              .join('');

          if (text) {
            console.log(
              '[LevelUp AI] ✅ Gemini respondió correctamente'
            );

            return text;
          }

          console.warn(
            '[LevelUp AI] ⚠️ Gemini respondió pero no devolvió texto'
          );
        } else {
          await logProviderError(
            'Gemini',
            res
          );
        }
      } catch (error) {
        console.warn(
          '[LevelUp AI] ❌ Gemini excepción:',
          error
        );
      }
    } else {
      console.warn(
        '[LevelUp AI] ⚠️ Gemini omitido: VITE_GEMINI_API_KEY no configurada'
      );
    }

    // ============================================================
    // 4. MISTRAL
    // ============================================================

    const mistralKey =
      import.meta.env.VITE_MISTRAL_KEY;

    if (mistralKey?.trim()) {
      try {
        console.log(
          '[LevelUp AI] 🟠 Probando Mistral...'
        );

        const res = await fetchWithTimeout(
          'https://api.mistral.ai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${mistralKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'mistral-small-latest',
              messages: formattedOpenAIStyle,
              temperature: 0.7,
              max_tokens: 2048
            })
          }
        );

        if (res.ok) {
          const data = await res.json();

          const text =
            data?.choices?.[0]?.message?.content;

          if (text) {
            console.log(
              '[LevelUp AI] ✅ Mistral respondió correctamente'
            );

            return text;
          }

          console.warn(
            '[LevelUp AI] ⚠️ Mistral respondió pero no devolvió texto'
          );
        } else {
          await logProviderError(
            'Mistral',
            res
          );
        }
      } catch (error) {
        console.warn(
          '[LevelUp AI] ❌ Mistral excepción:',
          error
        );
      }
    } else {
      console.warn(
        '[LevelUp AI] ⚠️ Mistral omitido: VITE_MISTRAL_KEY no configurada'
      );
    }

    // ============================================================
    // 5. COHERE
    // ============================================================

    const cohereKey =
      import.meta.env.VITE_COHERE_API_KEY;

    if (cohereKey?.trim()) {
      try {
        console.log(
          '[LevelUp AI] 🟡 Probando Cohere...'
        );

        const cohereMessages = [
          {
            role: 'system',
            content: systemPrompt
          },
          ...allMessages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        ];

        const res = await fetchWithTimeout(
          'https://api.cohere.com/v2/chat',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cohereKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'command-a-plus-05-2026',
              messages: cohereMessages,
              temperature: 0.7,
              max_tokens: 2048
            })
          }
        );

        if (res.ok) {
          const data = await res.json();

          const text =
            data?.message?.content
              ?.map(
                (item: any) =>
                  item?.text || ''
              )
              .join('');

          if (text) {
            console.log(
              '[LevelUp AI] ✅ Cohere respondió correctamente'
            );

            return text;
          }

          console.warn(
            '[LevelUp AI] ⚠️ Cohere respondió pero no devolvió texto'
          );
        } else {
          await logProviderError(
            'Cohere',
            res
          );
        }
      } catch (error) {
        console.warn(
          '[LevelUp AI] ❌ Cohere excepción:',
          error
        );
      }
    } else {
      console.warn(
        '[LevelUp AI] ⚠️ Cohere omitido: VITE_COHERE_API_KEY no configurada'
      );
    }

    // ============================================================
    // 6. HUGGING FACE
    // ============================================================

    const hfKey =
      import.meta.env.VITE_HUGGINGFACE_API_KEY;

    if (hfKey?.trim()) {
      try {
        console.log(
          '[LevelUp AI] 🤗 Probando Hugging Face...'
        );

        const res = await fetchWithTimeout(
          'https://router.huggingface.co/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${hfKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model:
                'openai/gpt-oss-120b:fastest',
              messages:
                formattedOpenAIStyle,
              temperature: 0.7,
              max_tokens: 2048,
              stream: false
            })
          }
        );

        if (res.ok) {
          const data = await res.json();

          const text =
            data?.choices?.[0]?.message?.content;

          if (text) {
            console.log(
              '[LevelUp AI] ✅ Hugging Face respondió correctamente'
            );

            return text;
          }

          console.warn(
            '[LevelUp AI] ⚠️ Hugging Face respondió pero no devolvió texto'
          );
        } else {
          await logProviderError(
            'Hugging Face',
            res
          );
        }
      } catch (error) {
        console.warn(
          '[LevelUp AI] ❌ Hugging Face excepción:',
          error
        );
      }
    } else {
      console.warn(
        '[LevelUp AI] ⚠️ Hugging Face omitido: VITE_HUGGINGFACE_API_KEY no configurada'
      );
    }

    throw new Error(
      'Ninguna API respondió con éxito.'
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };

    const updatedMessages = [
      ...messages,
      userMessage
    ];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      console.log(
        '[LevelUp AI] 🚀 Iniciando cascada de IAs...'
      );

      const aiText =
        await fetchAIWithFullCascade(
          updatedMessages
        );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiText
        }
      ]);

      console.log(
        '[LevelUp AI] 🎉 Respuesta obtenida correctamente'
      );
    } catch (error) {
      console.error(
        '[LevelUp AI] ❌ Error en cascada total:',
        error
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Lo siento, todas las IAs configuradas están temporalmente agotadas o inaccesibles. Revisa la consola para ver cuál falló.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="ai-assistant-button"
        onClick={() =>
          setIsOpen(!isOpen)
        }
      >
        <span>
          {isOpen ? '❌' : '✨'}
        </span>

        <span className="ai-text">
          LevelUp AI
        </span>
      </div>

      {isOpen && (
        <div className="ai-chat-window">

          <div
            className="ai-chat-header"
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h4>
                LevelUp Assistant
              </h4>

              <p>
                {activeCourse
                  ? `Viendo: ${activeCourse.title}`
                  : 'Omni-AI Cascade'}
              </p>
            </div>

            <button
              onClick={clearChat}
              title="Limpiar chat"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              🗑️
            </button>
          </div>

          <div className="ai-chat-messages">

            {messages.map(
              (msg, i) => (
                <div
                  key={i}
                  className={`message-bubble ${msg.role}`}
                >
                  {msg.role ===
                  'assistant' ? (
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              )
            )}

            {loading && (
              <div className="message-bubble assistant pulsate">
                Buscando en la red de IAs...
              </div>
            )}

            <div ref={chatEndRef} />

          </div>

          <div className="ai-chat-input">

            <input
              type="text"
              placeholder="Pregunta algo..."
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              disabled={loading}
            />

            <button
              onClick={handleSend}
              disabled={loading}
            >
              enviar
            </button>

          </div>

        </div>
      )}
    </>
  );
};
