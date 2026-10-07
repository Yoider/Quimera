'use client';

import React, { useState, useMemo } from 'react';
import {
  RestaurantTableData,
  ActiveOrderData,
  createOrUpdateTableOrderAction,
  closeAndPayTableOrderAction,
} from './orderActions';
import {
  X,
  Plus,
  Minus,
  Search,
  Users,
  ChefHat,
  Send,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  UtensilsCrossed,
  Beer,
  Sparkles,
} from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  format: string;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
}

interface StaffWaiterPdaModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTableData;
  activeOrder: ActiveOrderData | null;
  products: ProductItem[];
  categories: CategoryItem[];
  onOrderSaved: () => void;
}

export default function StaffWaiterPdaModal({
  isOpen,
  onClose,
  table,
  activeOrder,
  products,
  categories,
  onOrderSaved,
}: StaffWaiterPdaModalProps) {
  const [pax, setPax] = useState<number>(activeOrder?.pax || table.seats || 2);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<
    { productId: string; product: ProductItem; quantity: number; notes: string }[]
  >([]);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeItemNoteModal, setActiveItemNoteModal] = useState<string | null>(null);

  // Filter products
  const availableProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.format.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, product, quantity: 1, notes: '' }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, notes } : i))
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  }, [cart]);

  const existingTotal = activeOrder?.totalAmount || 0;
  const grandTotal = existingTotal + cartTotal;

  // Submit order to kitchen
  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await createOrUpdateTableOrderAction({
        tableNumber: table.tableNumber,
        tableId: table.id,
        pax,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
        generalNotes: generalNotes.trim() || undefined,
      });

      if (res.success) {
        setCart([]);
        onOrderSaved();
        onClose();
      } else {
        alert(res.error || 'Error al enviar comanda.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close and pay
  const handlePayOrder = async () => {
    if (!activeOrder) return;
    if (confirm(`¿Cobrar comanda de ${table.name} por un total de ${activeOrder.totalAmount.toFixed(2)}€ y liberar la mesa?`)) {
      setIsSubmitting(true);
      try {
        const res = await closeAndPayTableOrderAction(activeOrder.id);
        if (res.success) {
          onOrderSaved();
          onClose();
        } else {
          alert(res.error || 'Error al cobrar.');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl border border-[#EADBC8] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header PDA */}
        <div className="p-4 bg-[#2B2523] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E2A2B] text-amber-100 flex items-center justify-center font-bold text-base shadow-xs border border-[#D4A373]/40">
              {table.zone === 'BARRA' ? '🍺' : table.zone === 'TERRAZA' ? '☀️' : '🍽️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-white">
                  {table.name}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-amber-200 border border-white/20">
                  Zona: {table.zone}
                </span>
                {activeOrder && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Ocupada · {activeOrder.orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                TPV PDA Camarero · Comanda y Servicio
              </p>
            </div>
          </div>

          {/* Pax Counter + Close */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-stone-800/80 px-3 py-1.5 rounded-2xl border border-stone-700">
              <Users className="w-4 h-4 text-[#D4A373]" />
              <span className="text-xs font-semibold text-stone-300">Comensales:</span>
              <button
                type="button"
                onClick={() => setPax((p) => Math.max(1, p - 1))}
                className="w-6 h-6 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center justify-center font-bold text-white transition-all cursor-pointer"
              >
                -
              </button>
              <span className="w-5 text-center font-bold text-white text-sm">
                {pax}
              </span>
              <button
                type="button"
                onClick={() => setPax((p) => p + 1)}
                className="w-6 h-6 rounded-lg bg-stone-700 hover:bg-stone-600 flex items-center justify-center font-bold text-white transition-all cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Two Panels Layout: Left (Catalog) + Right (Ticket / Cart) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Product Catalog (2/3 width) */}
          <div className="flex-1 flex flex-col border-r border-[#EADBC8] bg-[#FAF8F5]/50 overflow-hidden">
            {/* Search and Category Bar */}
            <div className="p-3 bg-white border-b border-[#EADBC8] space-y-2 shrink-0">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar plato, ración o bebida..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EADBC8] bg-stone-50 text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#9E2A2B] text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  Todas ({products.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                      selectedCategory === c.id
                        ? 'bg-[#9E2A2B] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 custom-scrollbar">
              {availableProducts.map((p) => {
                const inCart = cart.find((i) => i.productId === p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group active:scale-95 ${
                      inCart
                        ? 'border-[#9E2A2B] bg-white ring-2 ring-[#9E2A2B]/20 shadow-md'
                        : 'border-[#EADBC8] bg-white hover:border-[#D4A373] hover:shadow-xs'
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#9E2A2B] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#6E6259] tracking-wider block">
                        {p.format}
                      </span>
                      <h4 className="font-serif font-bold text-xs text-[#2B2523] line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <span className="font-bold text-sm text-[#9E2A2B]">
                        {p.price.toFixed(2)}€
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] group-hover:bg-[#9E2A2B] group-hover:text-white border border-[#EADBC8] flex items-center justify-center font-bold text-xs transition-colors">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Order Ticket & Action Panel (1/3 width) */}
          <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white overflow-hidden shrink-0">
            {/* Ticket Header */}
            <div className="p-3.5 bg-[#FAF8F5] border-b border-[#EADBC8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#9E2A2B]" />
                <h4 className="font-serif font-bold text-sm text-[#2B2523]">
                  Comanda de Mesa
                </h4>
              </div>
              <span className="text-xs text-[#6E6259]">
                {cart.length} nuevos platos
              </span>
            </div>

            {/* Scrollable Items Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {/* Existing Order Items already in Kitchen/Served */}
              {activeOrder && activeOrder.items.length > 0 && (
                <div className="space-y-2 pb-2 border-b border-[#EADBC8]">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    <span>Ya servido / En cocina</span>
                    <span className="text-emerald-700">
                      {existingTotal.toFixed(2)}€
                    </span>
                  </div>
                  {activeOrder.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-stone-700">
                          {it.quantity}x {it.productName}
                        </span>
                        {it.notes && (
                          <span className="text-[10px] text-amber-800 block italic">
                            Nota: {it.notes}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-stone-600">
                        {(it.unitPrice * it.quantity).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Newly added items in cart */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9E2A2B] mb-2 flex items-center justify-between">
                  <span>Nueva Ronda para marchar</span>
                  <span>{cartTotal.toFixed(2)}€</span>
                </div>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs">
                    Toca platos en el catálogo para añadir a la comanda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="p-2.5 rounded-2xl border border-amber-200 bg-amber-50/20 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#2B2523] truncate max-w-[150px]">
                            {item.product.name}
                          </span>
                          <span className="font-bold text-xs text-[#9E2A2B]">
                            {(item.product.price * item.quantity).toFixed(2)}€
                          </span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pt-1">
                          {/* Note input toggle */}
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) =>
                              updateItemNotes(item.productId, e.target.value)
                            }
                            placeholder="Nota de cocina (ej: Sin sal, bien hecho)..."
                            className="text-[11px] px-2 py-1 rounded-lg border border-stone-200 bg-white w-40 text-stone-700 focus:outline-none"
                          />

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.productId)}
                              className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 flex items-center justify-center font-bold hover:bg-stone-100 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item.product)}
                              className="w-6 h-6 rounded-lg bg-white border border-stone-200 text-stone-700 flex items-center justify-center font-bold hover:bg-stone-100 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Footer / Summary & Actions */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#EADBC8] space-y-3 shrink-0">
              <div className="flex items-center justify-between text-sm font-bold text-[#2B2523]">
                <span>Total Mesa ({pax} pax):</span>
                <span className="text-lg text-[#9E2A2B]">
                  {grandTotal.toFixed(2)}€
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Send new round */}
                <button
                  type="button"
                  onClick={handleSendOrder}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full py-3 rounded-2xl bg-[#9E2A2B] hover:bg-[#832223] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Marchando comanda...'
                      : `Marchar Comanda a Cocina (${cartTotal.toFixed(2)}€)`}
                  </span>
                </button>

                {/* If active order exists, allow payment / close */}
                {activeOrder && (
                  <button
                    type="button"
                    onClick={handlePayOrder}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-2xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Cobrar Cuenta ({existingTotal.toFixed(2)}€) y Liberar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
