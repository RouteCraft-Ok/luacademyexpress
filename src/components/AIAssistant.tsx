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

  const [activeCourse, setActiveCourse] = useState<any>(
    selectedCourse ?? null
  );

  useEffect(() => {
    setActiveCourse(selectedCourse ?? null);
  }, [selectedCourse]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const savedChat = localStorage.getItem('levelup_chat_history');
      if (savedChat) {
        return JSON.parse(savedChat);
      }
    } catch (error) {
      console.warn('No se pudo cargar el historial:', error);
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
      console.warn('No se pudo guardar el historial:', error);
    }

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    localStorage.removeItem('levelup_chat_history');
  };

  /**
   * Llama a nuestra función serverless /api/chat.
   * Las claves viven SOLO en el servidor de Vercel.
   */
  const fetchAI = async (
    allMessages: ChatMessage[]
  ): Promise<string> => {
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

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: allMessages,
        systemPrompt
      })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Error al consultar la IA');
    }

    return data.respuesta;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      console.log('[LevelUp AI] 🚀 Consultando /api/chat...');

      const aiText = await fetchAI(updatedMessages);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiText }
      ]);

      console.log('[LevelUp AI] 🎉 Respuesta obtenida');
    } catch (error) {
      console.error('[LevelUp AI] ❌ Error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Lo siento, las IAs están temporalmente agotadas o inaccesibles. Revisa la consola para más detalles.'
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
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{isOpen ? '❌' : '✨'}</span>
        <span className="ai-text">LevelUp AI</span>
      </div>

      {isOpen && (
        <div className="ai-chat-window">
          <div
            className="ai-chat-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h4>LevelUp Assistant</h4>
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
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message-bubble ${msg.role}`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            ))}

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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSend();
                }
              }}
              disabled={loading}
            />

            <button onClick={handleSend} disabled={loading}>
              enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
};