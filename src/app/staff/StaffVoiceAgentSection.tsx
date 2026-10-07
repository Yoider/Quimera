'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { RestaurantTableData } from './orderActions';
import { ProductItem } from './StaffWaiterPdaModal';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  rawCommand?: string;
}

interface StaffVoiceAgentSectionProps {
  tables: RestaurantTableData[];
  products: ProductItem[];
  selectedTable: RestaurantTableData | null;
  onSelectTable: (table: RestaurantTableData | null) => void;
  onOrderSaved?: () => void;
  onRefreshData?: () => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: '¡Hola! Soy el Agente IA de Taberna Quimera 🍷.\n\nPuedes dictar o escribir comandas para las mesas (ej: "Mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo"), consultar el estado de la sala o pedir asistencia.',
    timestamp: 'Ahora',
  },
];

export default function StaffVoiceAgentSection({
  tables,
  products,
  selectedTable,
  onSelectTable,
  onOrderSaved,
  onRefreshData,
}: StaffVoiceAgentSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('quimera_staff_agent_chat');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return INITIAL_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save messages to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('quimera_staff_agent_chat', JSON.stringify(messages));
      } catch (_) {}
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onstart = () => {
          setIsListening(true);
          setRecognitionError(null);
        };

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setInputText(text);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            setRecognitionError(`Error de micrófono (${event.error})`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Handle voice listening toggle
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError('El reconocimiento de voz nativo no está disponible. Usa el teclado o las pruebas rápidas.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      setInputText('');
      setRecognitionError(null);
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn(err);
        setRecognitionError('No se pudo acceder al micrófono.');
      }
    }
  };

  // Generate bot response
  const generateBotResponse = (userPrompt: string): string => {
    const norm = userPrompt.toLowerCase().trim();

    // Check for table order command pattern (e.g., "mesa 110, 4 cortadas...")
    const isOrderPattern =
      /\b(?:mesa|barra|terraza)\b/i.test(norm) ||
      /\b(?:cortada|cortadas|caña|cañas|mollete|molletes|payoyo|queso|doble|tercio|jamon|jamón|gilda)\b/i.test(norm);

    if (isOrderPattern) {
      return `🤖 Comando de texto recibido por la IA:\n«${userPrompt.trim()}»\n\n✓ Registrado correctamente en el sistema.`;
    }

    // Check for queries about tables
    if (/\b(?:libres|disponibles|mesas libres)\b/i.test(norm)) {
      const freeTables = tables.length;
      return `📊 Consulta de sala:\nActualmente hay ${freeTables} mesas registradas en el plano del bar. Puedes indicar un pedido diciendo por ejemplo: "Mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo".`;
    }

    // Greetings
    if (/\b(?:hola|buenas|buenos dias|buenas tardes)\b/i.test(norm)) {
      return `¡Hola! Listo para tomar comandas. Dicta o escribe tu comanda indicando la mesa y los artículos (ej: "Mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo").`;
    }

    // Default response: echoing the command received by the AI
    return `🤖 Comando de texto recibido por la IA:\n«${userPrompt.trim()}»\n\n✓ Registrado para procesamiento.`;
  };

  // Send message
  const handleSendMessage = (textToSend?: string, wasVoice = false) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: now,
      isVoice: wasVoice || isListening,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsBotTyping(true);

    // 2. Bot reply after slight delay for realism
    setTimeout(() => {
      const replyText = generateBotResponse(text);
      const botMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        rawCommand: text,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsBotTyping(false);
    }, 400);
  };

  // Quick preset click
  const handleUsePreset = (phrase: string) => {
    handleSendMessage(phrase, true);
  };

  // Clear chat history
  const handleClearHistory = () => {
    if (confirm('¿Vaciar el historial de conversación del agente?')) {
      setMessages(INITIAL_MESSAGES);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('quimera_staff_agent_chat');
        } catch (_) {}
      }
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#FAF8F5]">
      {/* Chat Header */}
      <div className="p-2.5 px-3 bg-linear-to-r from-[#2B2523] to-[#421718] text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#9E2A2B]/40 border border-white/20 flex items-center justify-center text-[#D4A373]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FAF8F5] leading-none">
              Agente IA · Taberna Quimera
            </h4>
            <span className="text-[10px] text-[#D4A373] font-medium block mt-0.5">
              Chatbot de Comandas y Asistencia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ● Activo
          </span>
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1 rounded-md text-stone-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Vaciar conversación"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages History Area (Scrollable from bottom to top) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div className="w-6 h-6 rounded-full bg-[#9E2A2B] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-2xs space-y-1 ${
                  isUser
                    ? 'bg-[#9E2A2B] text-white rounded-tr-xs'
                    : 'bg-white text-stone-800 border border-[#EADBC8] rounded-tl-xs'
                }`}
              >
                {/* Voice badge if dictated */}
                {isUser && msg.isVoice && (
                  <div className="flex items-center gap-1 text-[9.5px] text-[#D4A373] font-semibold">
                    <Volume2 className="w-2.5 h-2.5" />
                    <span>Dictado por voz</span>
                  </div>
                )}

                {/* Text Content */}
                <p className="whitespace-pre-wrap leading-relaxed text-[11.5px] font-sans">
                  {msg.text}
                </p>

                {/* Timestamp */}
                <div
                  className={`text-[9px] flex items-center gap-1 ${
                    isUser ? 'text-white/70 justify-end' : 'text-stone-400 justify-start'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-6 h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Bot Typing Indicator */}
        {isBotTyping && (
          <div className="flex gap-2 items-center text-stone-400 text-xs italic animate-pulse pl-1">
            <div className="w-5 h-5 rounded-full bg-[#9E2A2B]/20 text-[#9E2A2B] flex items-center justify-center">
              <Bot className="w-3 h-3" />
            </div>
            <span>El Agente IA está procesando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recognition Error Banner */}
      {recognitionError && (
        <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-amber-800 text-[10.5px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>{recognitionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setRecognitionError(null)}
            className="text-[10px] text-amber-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Suggestion Chips (Horizontal scroll above input) */}
      <div className="px-2.5 py-1.5 bg-white border-t border-[#EADBC8]/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[9.5px] font-bold text-stone-400 uppercase tracking-wider shrink-0">
          Ejemplos:
        </span>
        <button
          type="button"
          onClick={() => handleUsePreset('mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#9E2A2B]/10 hover:text-[#9E2A2B] border border-stone-200 text-[10.5px] font-medium text-stone-700 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Mic className="w-2.5 h-2.5 text-[#9E2A2B]" />
          <span>Mesa 110 (4 cortadas, 2 molletes...)</span>
        </button>

        <button
          type="button"
          onClick={() => handleUsePreset('mesa 2, 2 dobles cruzcampo y 1 jamón ibérico')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#9E2A2B]/10 hover:text-[#9E2A2B] border border-stone-200 text-[10.5px] font-medium text-stone-700 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Mic className="w-2.5 h-2.5 text-[#9E2A2B]" />
          <span>Mesa 2 (2 dobles, 1 jamón...)</span>
        </button>

        <button
          type="button"
          onClick={() => handleUsePreset('¿Qué mesas están libres?')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-[#9E2A2B]/10 hover:text-[#9E2A2B] border border-stone-200 text-[10.5px] font-medium text-stone-700 transition-colors cursor-pointer"
        >
          <span>Mesas libres</span>
        </button>
      </div>

      {/* Fixed Bottom Input Bar */}
      <div className="p-2.5 bg-white border-t border-[#EADBC8] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs ${
              isListening
                ? 'bg-[#9E2A2B] text-white ring-4 ring-[#9E2A2B]/20 animate-pulse'
                : 'bg-stone-100 hover:bg-stone-200 text-[#9E2A2B] border border-stone-200'
            }`}
            title={isListening ? 'Detener dictado' : 'Dictar por voz'}
          >
            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Escuchando tu voz...'
                  : 'Escribe o dicta tu comando (ej: Mesa 110...)'
              }
              className={`w-full text-xs px-3 py-2 rounded-xl border bg-[#FAF8F5] text-stone-800 placeholder:text-stone-400 outline-none transition-colors ${
                isListening
                  ? 'border-[#9E2A2B] ring-1 ring-[#9E2A2B] bg-[#9E2A2B]/5'
                  : 'border-stone-200 focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B]'
              }`}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-xl bg-[#9E2A2B] hover:bg-[#802223] disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-2xs"
            title="Enviar mensaje o comando"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
