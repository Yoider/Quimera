'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Beer,
  ChefHat,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Users,
  Search,
  MessageSquare,
  Check,
} from 'lucide-react';
import {
  parseVoiceOrder,
  ParsedVoiceItem,
  VoiceOrderResult,
  DestinationStation,
  STATIONS,
} from './voiceOrderAgent';
import {
  RestaurantTableData,
  createOrUpdateTableOrderAction,
  openTableServiceAction,
  saveRestaurantTableAction,
} from './orderActions';
import { ProductItem } from './StaffWaiterPdaModal';

interface StaffVoiceAgentSectionProps {
  tables: RestaurantTableData[];
  products: ProductItem[];
  selectedTable: RestaurantTableData | null;
  onSelectTable: (table: RestaurantTableData | null) => void;
  onOrderSaved?: () => void;
  onRefreshData?: () => void;
}

export default function StaffVoiceAgentSection({
  tables,
  products,
  selectedTable,
  onSelectTable,
  onOrderSaved,
  onRefreshData,
}: StaffVoiceAgentSectionProps) {
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // Parsed order states (Human in the loop)
  const [parsedItems, setParsedItems] = useState<ParsedVoiceItem[]>([]);
  const [targetTableNumber, setTargetTableNumber] = useState<string>(
    selectedTable ? selectedTable.tableNumber : 'Mesa 110'
  );
  const [pax, setPax] = useState<number>(selectedTable?.seats || 2);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [unmatchedPhrases, setUnmatchedPhrases] = useState<string[]>([]);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<{
    orderNumber?: string;
    tableNumber: string;
    itemsCount: number;
    total: number;
  } | null>(null);

  // Manual extra item picker
  const [isAddingItemManually, setIsAddingItemManually] = useState(false);
  const [manualSearch, setManualSearch] = useState('');

  // SpeechRecognition reference
  const recognitionRef = useRef<any>(null);

  // Sync targetTableNumber if selectedTable changes
  useEffect(() => {
    if (selectedTable && !targetTableNumber) {
      setTargetTableNumber(selectedTable.tableNumber);
      setPax(selectedTable.seats || 2);
    }
  }, [selectedTable]);

  // Setup Web Speech API
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
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            setRecognitionError(`Error de reconocimiento (${event.error}). Puedes escribir abajo.`);
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

  // Process transcript whenever it updates or when triggered
  const handleProcessTranscript = (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    const result = parseVoiceOrder(
      textToProcess,
      products,
      tables.map((t) => ({ tableNumber: t.tableNumber, name: t.name }))
    );

    if (result.detectedTableNumber) {
      setTargetTableNumber(result.detectedTableNumber);
      const matched = tables.find((t) => t.tableNumber === result.detectedTableNumber);
      if (matched) {
        onSelectTable(matched);
        setPax(matched.seats || 2);
      }
    } else if (selectedTable) {
      setTargetTableNumber(selectedTable.tableNumber);
    }

    setParsedItems(result.items);
    setUnmatchedPhrases(result.unmatchedPhrases);
    setSuccessFeedback(null);
  };

  // Toggle voice recording
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      // Fallback if browser doesn't support Web Speech API
      setRecognitionError(
        'El reconocimiento por voz nativo no está disponible en este navegador. Usa las pruebas rápidas o escribe el comando.'
      );
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
      handleProcessTranscript(transcript);
    } else {
      setTranscript('');
      setRecognitionError(null);
      setSuccessFeedback(null);
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn(err);
        setRecognitionError('No se pudo iniciar el micrófono. Verifica los permisos.');
      }
    }
  };

  // Use pre-configured demo phrases for testing
  const handleUsePresetPhrase = (phrase: string) => {
    setTranscript(phrase);
    handleProcessTranscript(phrase);
  };

  // Stepper quantity changes
  const handleUpdateItemQuantity = (itemId: string, delta: number) => {
    setParsedItems((prev) =>
      prev
        .map((it) => {
          if (it.id !== itemId) return it;
          const nextQty = it.quantity + delta;
          if (nextQty <= 0) return null;
          return {
            ...it,
            quantity: nextQty,
            totalPrice: Math.round(it.unitPrice * nextQty * 100) / 100,
          };
        })
        .filter(Boolean) as ParsedVoiceItem[]
    );
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setParsedItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Update item note
  const handleUpdateItemNote = (itemId: string, notes: string) => {
    setParsedItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, notes } : it))
    );
  };

  // Update item station manually
  const handleUpdateItemStation = (itemId: string, station: DestinationStation) => {
    setParsedItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, station } : it))
    );
  };

  // Add manual product to items list
  const handleAddManualProduct = (prod: ProductItem) => {
    const newItem: ParsedVoiceItem = {
      id: `manual-item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      quantity: 1,
      unitPrice: prod.price,
      totalPrice: prod.price,
      station: (prod.categoryId || '').includes('bebidas')
        ? 'BEBIDAS'
        : (prod.categoryId || '').includes('papelones')
        ? 'CHACINAS'
        : 'COCINA',
    };
    setParsedItems((prev) => [...prev, newItem]);
    setIsAddingItemManually(false);
    setManualSearch('');
  };

  // Submit and March the Order (Human in the loop execution)
  const handleMarchOrder = async () => {
    if (!targetTableNumber.trim()) {
      alert('Por favor especifica la mesa de destino.');
      return;
    }
    if (parsedItems.length === 0) {
      alert('No hay artículos válidos para marchar. Dicta o añade platos a la comanda.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Ensure table exists in database or create dynamic table if it's e.g. "Mesa 110"
      let existingTable = tables.find(
        (t) =>
          t.tableNumber.toLowerCase() === targetTableNumber.trim().toLowerCase() ||
          t.name.toLowerCase() === targetTableNumber.trim().toLowerCase()
      );

      if (!existingTable) {
        // Create table dynamically so order can be attached
        const resTable = await saveRestaurantTableAction({
          tableNumber: targetTableNumber.trim(),
          name: targetTableNumber.trim(),
          zone: 'SALON',
          seats: pax,
          shape: 'ROUND',
          posX: 50,
          posY: 50,
          color: '#9E2A2B',
        });
        if (resTable.success && resTable.table) {
          existingTable = resTable.table;
        }
      }

      // 2. Open service if table is currently free
      await openTableServiceAction({
        tableNumber: targetTableNumber.trim(),
        pax,
      });

      // 3. Create or append active order with all items
      const resOrder = await createOrUpdateTableOrderAction({
        tableNumber: targetTableNumber.trim(),
        tableId: existingTable?.id,
        pax,
        items: parsedItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          notes: it.notes || undefined,
        })),
        generalNotes: generalNotes.trim() || undefined,
      });

      if (resOrder.success) {
        const total = parsedItems.reduce((acc, it) => acc + it.totalPrice, 0);
        setSuccessFeedback({
          orderNumber: resOrder.orderId,
          tableNumber: targetTableNumber.trim(),
          itemsCount: parsedItems.reduce((acc, it) => acc + it.quantity, 0),
          total,
        });

        // Clear draft items
        setParsedItems([]);
        setTranscript('');
        setUnmatchedPhrases([]);

        onOrderSaved?.();
        onRefreshData?.();
      } else {
        alert(resOrder.error || 'Error al marchar la comanda.');
      }
    } catch (e: any) {
      console.error('Error marching order:', e);
      alert(e.message || 'Error al marchar la comanda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by Destination Station
  const itemsByStation: Record<DestinationStation, ParsedVoiceItem[]> = {
    BEBIDAS: parsedItems.filter((i) => i.station === 'BEBIDAS'),
    CHACINAS: parsedItems.filter((i) => i.station === 'CHACINAS'),
    COCINA: parsedItems.filter((i) => i.station === 'COCINA'),
  };

  const totalCalculated = parsedItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const totalUnits = parsedItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="space-y-3.5">
      {/* Banner / Header */}
      <div className="p-3 rounded-xl bg-linear-to-r from-[#2B2523] to-[#421718] text-white shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#9E2A2B]/40 border border-white/20 flex items-center justify-center text-[#D4A373] shadow-inner">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FAF8F5] leading-none">
              Agente Comandero IA
            </h4>
            <span className="text-[10.5px] text-[#D4A373] font-medium block mt-0.5">
              Comandos de Voz & Human-in-the-Loop
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isListening
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isListening ? '🎙️ Escuchando...' : '● Listo'}
        </span>
      </div>

      {/* Voice Recognition Action Card */}
      <div className="p-3 bg-white rounded-xl border border-[#EADBC8] shadow-xs space-y-2.5">
        <div className="flex flex-col items-center justify-center text-center py-2">
          {/* Circular Microphone Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer relative shadow-lg ${
              isListening
                ? 'bg-[#9E2A2B] text-white ring-8 ring-[#9E2A2B]/20 animate-pulse scale-105'
                : 'bg-stone-100 hover:bg-[#9E2A2B] text-stone-700 hover:text-white border-2 border-[#EADBC8]'
            }`}
            title={isListening ? 'Detener y procesar audio' : 'Pulsar para hablar comando de voz'}
          >
            {isListening ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-[#9E2A2B] group-hover:text-white" />
            )}
          </button>

          <span className="text-xs font-bold text-stone-800 mt-2">
            {isListening ? 'Escuchando tu voz...' : 'Toca el micrófono para hablar'}
          </span>
          <p className="text-[10.5px] text-stone-500 max-w-[240px]">
            {isListening
              ? 'Di por ejemplo: "Mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo"'
              : 'Dicta la mesa, platos y bebidas para enlistarlos automáticamente'}
          </p>
        </div>

        {/* Live Audio Waves Simulation while Listening */}
        {isListening && (
          <div className="flex items-center justify-center gap-1 py-1">
            <span className="w-1 h-3 bg-[#9E2A2B] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1 h-5 bg-[#9E2A2B] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1 h-7 bg-[#9E2A2B] rounded-full animate-bounce" />
            <span className="w-1 h-4 bg-[#9E2A2B] rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1 h-2 bg-[#9E2A2B] rounded-full animate-bounce [animation-delay:-0.4s]" />
          </div>
        )}

        {/* Transcript Text Input / Display */}
        <div className="space-y-1.5">
          <div className="relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="O escribe o corrige aquí: Ej. Mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo..."
              rows={2}
              className="w-full text-xs p-2.5 rounded-lg border border-stone-200 focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] bg-[#FAF8F5] text-stone-800 resize-none font-medium placeholder:text-stone-400"
            />
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="absolute top-2 right-2 text-stone-400 hover:text-stone-600 text-[10px]"
                title="Limpiar texto"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleProcessTranscript(transcript)}
              disabled={!transcript.trim()}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#9E2A2B] hover:bg-[#802223] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interpretar Comando</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {recognitionError && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
            <span>{recognitionError}</span>
          </div>
        )}

        {/* Quick Demo Chips */}
        <div className="space-y-1 pt-1 border-t border-stone-100">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Pruebas Rápidas de Voz:
          </span>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() =>
                handleUsePresetPhrase('mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo')
              }
              className="text-left p-1.5 rounded-md bg-stone-50 hover:bg-[#9E2A2B]/10 hover:text-[#9E2A2B] border border-stone-200 text-[11px] font-medium text-stone-700 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>🎙️ "Mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo"</span>
              <span className="text-[9.5px] font-bold text-[#9E2A2B] shrink-0">Probar →</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleUsePresetPhrase('mesa 2, 2 dobles cruzcampo, 1 jamon iberico y 2 molletes pringa')
              }
              className="text-left p-1.5 rounded-md bg-stone-50 hover:bg-[#9E2A2B]/10 hover:text-[#9E2A2B] border border-stone-200 text-[11px] font-medium text-stone-700 transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>🎙️ "Mesa 2, 2 dobles cruzcampo, 1 jamón ibérico y 2 molletes pringá"</span>
              <span className="text-[9.5px] font-bold text-[#9E2A2B] shrink-0">Probar →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Feedback Card */}
      {successFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 shadow-2xs space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>¡Comanda marchada con éxito a partidas!</span>
          </div>
          <p className="text-[11px] text-emerald-700 pl-5">
            Mesa: <strong>{successFeedback.tableNumber}</strong> ·{' '}
            {successFeedback.itemsCount} artículos marchados por un total de{' '}
            <strong>{successFeedback.total.toFixed(2)}€</strong>.
          </p>
        </div>
      )}

      {/* ================= HUMAN IN THE LOOP (HITL) VALIDATION PANEL ================= */}
      {parsedItems.length > 0 && (
        <div className="p-3 bg-white rounded-xl border-2 border-[#9E2A2B]/40 shadow-md space-y-3">
          {/* Header HITL */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h5 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                Human-in-the-Loop · Validación
              </h5>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#9E2A2B]/10 text-[#9E2A2B]">
              {totalUnits} artículos
            </span>
          </div>

          {/* Table & Pax Assignment */}
          <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#EADBC8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#9E2A2B] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9.5px] text-stone-400 font-bold uppercase leading-none">Mesa:</span>
                <input
                  type="text"
                  value={targetTableNumber}
                  onChange={(e) => setTargetTableNumber(e.target.value)}
                  className="text-xs font-bold text-stone-800 bg-white border border-stone-200 rounded px-1.5 py-0.5 w-24"
                  placeholder="Mesa..."
                />
              </div>
            </div>

            {/* Pax stepper */}
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-500" />
              <button
                type="button"
                onClick={() => setPax((p) => Math.max(1, p - 1))}
                className="w-5 h-5 rounded bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-100"
              >
                -
              </button>
              <span className="text-xs font-bold text-stone-800 w-5 text-center">{pax}p</span>
              <button
                type="button"
                onClick={() => setPax((p) => p + 1)}
                className="w-5 h-5 rounded bg-white border border-stone-200 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Unmatched words warning if any */}
          {unmatchedPhrases.length > 0 && (
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px]">
              <span className="font-bold">⚠️ Texto no reconocido:</span>{' '}
              {unmatchedPhrases.join(', ')}
            </div>
          )}

          {/* DISPATCH STATIONS BREAKDOWN (Bebidas, Chacinas, Cocina) */}
          <div className="space-y-2.5">
            {(['BEBIDAS', 'CHACINAS', 'COCINA'] as DestinationStation[]).map((stationKey) => {
              const stationConfig = STATIONS[stationKey];
              const stationItems = itemsByStation[stationKey];
              if (stationItems.length === 0) return null;

              return (
                <div
                  key={stationKey}
                  className={`p-2.5 rounded-xl border ${stationConfig.badgeBorder} ${stationConfig.badgeBg} space-y-1.5`}
                >
                  {/* Station Title */}
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      {stationKey === 'BEBIDAS' ? (
                        <Beer className="w-3.5 h-3.5 text-amber-700" />
                      ) : stationKey === 'CHACINAS' ? (
                        <ChefHat className="w-3.5 h-3.5 text-rose-700" />
                      ) : (
                        <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                      )}
                      <span className={stationConfig.badgeColor}>{stationConfig.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-stone-500">
                      {stationItems.reduce((acc, i) => acc + i.quantity, 0)} uds
                    </span>
                  </div>

                  {/* Items List in this Station */}
                  <div className="space-y-1.5 pt-1">
                    {stationItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-2 rounded-lg border border-stone-200/80 shadow-2xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-stone-800 block truncate">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-stone-500 font-semibold">
                              {item.unitPrice.toFixed(2)}€ / ud · Subtotal:{' '}
                              <strong className="text-stone-800">{item.totalPrice.toFixed(2)}€</strong>
                            </span>
                          </div>

                          {/* Stepper controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center text-xs font-bold text-stone-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-md bg-[#9E2A2B] hover:bg-[#802223] text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer ml-1"
                              title="Quitar plato"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Special Note input */}
                        <div className="pt-0.5">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateItemNote(item.id, e.target.value)}
                            placeholder="Nota opcional (ej: muy fría, sin gluten)..."
                            className="w-full text-[10.5px] px-2 py-0.5 rounded bg-stone-50 border border-stone-200 text-stone-700 placeholder:text-stone-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Manual Item Option */}
          <div>
            {!isAddingItemManually ? (
              <button
                type="button"
                onClick={() => setIsAddingItemManually(true)}
                className="w-full py-1.5 rounded-lg border border-dashed border-stone-300 hover:border-[#9E2A2B] text-stone-600 hover:text-[#9E2A2B] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir otro plato manualmente</span>
              </button>
            ) : (
              <div className="p-2 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-stone-200">
                  <Search className="w-3 h-3 text-stone-400" />
                  <input
                    type="text"
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                    placeholder="Buscar plato en la carta..."
                    className="w-full text-xs bg-transparent outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingItemManually(false)}
                    className="text-[10px] text-stone-400 hover:text-stone-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {products
                    .filter((p) =>
                      manualSearch ? p.name.toLowerCase().includes(manualSearch.toLowerCase()) : true
                    )
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddManualProduct(p)}
                        className="w-full text-left p-1 rounded bg-white hover:bg-stone-100 border border-stone-100 text-[11px] font-medium flex items-center justify-between"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="font-bold text-[#9E2A2B] shrink-0 ml-1">
                          {p.price.toFixed(2)}€
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* General Order Notes */}
          <div>
            <input
              type="text"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Notas generales de la comanda (ej: terraza exterior)..."
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-stone-800 placeholder:text-stone-400"
            />
          </div>

          {/* Order Total & Dispatch Button */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-600">Total a marchar:</span>
              <span className="text-sm font-extrabold text-[#9E2A2B]">
                {totalCalculated.toFixed(2)}€
              </span>
            </div>

            <button
              type="button"
              onClick={handleMarchOrder}
              disabled={isSubmitting || parsedItems.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-[#9E2A2B] to-[#781D1E] hover:from-[#781D1E] hover:to-[#5E1617] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Marchando a Partidas...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    Validar y Marchar Comanda ({totalCalculated.toFixed(2)}€)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
