'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Product, Category, AllergenType } from '@/types/menu';
import { updateProductAction, createProductAction, uploadProductImageAction } from '@/app/staff/actions';
import {
  X,
  Image as ImageIcon,
  DollarSign,
  Utensils,
  Tag,
  AlertCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  Link as LinkIcon,
  Check,
} from 'lucide-react';

interface StaffProductModalProps {
  isOpen: boolean;
  mode: 'edit' | 'create';
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (product: Product) => void;
  onRequestDelete?: (product: Product) => void;
}

const ALL_ALLERGENS: AllergenType[] = [
  'Gluten',
  'Lácteos',
  'Huevos',
  'Pescado',
  'Crustáceos',
  'Moluscos',
  'Frutos de cáscara',
  'Cacahuetes',
  'Soja',
  'Apio',
  'Mostaza',
  'Sésamo',
  'Sulfitos',
  'Altramuces',
];

const COMMON_FORMATS = ['Tapa', 'Media Ración', 'Ración', 'Unidad', '100grs', 'Copa', 'Caña', 'Botella', 'Mollete'];

export default function StaffProductModal({
  isOpen,
  mode,
  product,
  categories,
  onClose,
  onSave,
  onRequestDelete,
}: StaffProductModalProps) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(4.5);
  const [format, setFormat] = useState('Ración');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsStr, setIngredientsStr] = useState('');
  const [badge, setBadge] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenType[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera & Image Upload States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setPhotoFeedback(null);
      setIsCameraActive(false);
      setShowUrlInput(false);

      if (mode === 'edit' && product) {
        setName(product.name);
        setDescription(product.description);
        setPrice(product.price);
        setFormat(product.format);
        setCategoryId(product.categoryId);
        setImageUrl(product.imageUrl);
        setIngredientsStr(product.ingredients.join(', '));
        setBadge(product.badge || '');
        setIsAvailable(product.isAvailable);
        setSelectedAllergens(product.allergens || []);
      } else {
        setName('');
        setDescription('');
        setPrice(4.5);
        setFormat('Ración');
        setCategoryId(categories[0]?.id || '');
        setImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80');
        setIngredientsStr('');
        setBadge('');
        setIsAvailable(true);
        setSelectedAllergens([]);
      }
    } else {
      stopCameraStream();
    }
  }, [isOpen, mode, product, categories]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Launch Live Camera Viewfinder or Native Camera
  const handleStartCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      stopCameraStream();
      setIsCameraActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('getUserMedia failed or was denied, opening native camera input:', err);
      stopCameraStream();
      // Automatic fallback to native camera file input (works on all smartphones)
      fileInputCameraRef.current?.click();
    }
  };

  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    handleStartCamera(nextFacing);
  };

  // Capture photo from active live video feed
  const handleCaptureVideoPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopCameraStream();
      processAndUploadImage(rawDataUrl);
    }
  };

  // Process file from file input (camera or gallery)
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      processAndUploadImage(rawDataUrl);
    };
    reader.readAsDataURL(file);
    // Reset file input value to allow taking another photo if needed
    e.target.value = '';
  };

  // Client-side image resize & compression to max 1200px
  const processAndUploadImage = (rawDataUrl: string) => {
    setIsUploadingImage(true);
    setPhotoFeedback('Procesando fotografía...');

    const img = new Image();
    img.onload = async () => {
      try {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.86);

        // Upload to server
        const res = await uploadProductImageAction(compressedDataUrl);
        if (res.success && res.url) {
          setImageUrl(res.url);
          setPhotoFeedback('¡Foto tomada y guardada con éxito!');
        } else {
          // Safe fallback: store base64 directly
          setImageUrl(compressedDataUrl);
          setPhotoFeedback('Foto capturada correctamente.');
        }
      } catch (err) {
        console.error('Error optimizing image:', err);
        setImageUrl(rawDataUrl);
        setPhotoFeedback('Foto añadida.');
      } finally {
        setIsUploadingImage(false);
        setTimeout(() => setPhotoFeedback(null), 4000);
      }
    };
    img.onerror = () => {
      setIsUploadingImage(false);
      setErrorMsg('No se pudo leer la imagen capturada.');
    };
    img.src = rawDataUrl;
  };

  const toggleAllergen = (allergen: AllergenType) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Introduce un precio válido en euros.');
      return;
    }

    const ingredientsList = ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      stopCameraStream();
      if (mode === 'edit' && product) {
        const res = await updateProductAction(product.id, {
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          format: format.trim() || 'Ración',
          categoryId: categoryId || categories[0]?.id,
          imageUrl: imageUrl.trim(),
          ingredients: ingredientsList.length > 0 ? ingredientsList : [name.trim()],
          allergens: selectedAllergens,
          badge: badge.trim() || null,
          isAvailable,
        });

        if (res.success && res.product) {
          onSave(res.product);
          handleClose();
        } else {
          setErrorMsg('Error al guardar los cambios del producto.');
        }
      } else {
        const res = await createProductAction({
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          format: format.trim() || 'Ración',
          categoryId: categoryId || categories[0]?.id,
          imageUrl: imageUrl.trim(),
          ingredients: ingredientsList.length > 0 ? ingredientsList : [name.trim()],
          allergens: selectedAllergens,
          badge: badge.trim() || undefined,
          isAvailable,
        });

        if (res.success && res.product) {
          onSave(res.product);
          handleClose();
        } else {
          setErrorMsg('Error al crear el nuevo plato.');
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={() => !isPending && handleClose()}
    >
      {/* Hidden File Inputs for Native Camera and File Picker */}
      <input
        ref={fileInputCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInputChange}
      />
      <input
        ref={fileInputGalleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#D4A373]/40 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#2B2523] text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9E2A2B] flex items-center justify-center text-amber-200 shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">
                {mode === 'edit' ? `Modificar Plato: ${product?.name}` : 'Añadir Nuevo Plato a la Carta'}
              </h3>
              <p className="text-xs text-[#D4A373]">
                {mode === 'edit'
                  ? 'Actualiza los datos, foto, precio o formato del plato'
                  : 'Registra un nuevo plato disponible en la carta digital'}
              </p>
            </div>
          </div>

          <button
            onClick={() => !isPending && handleClose()}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto bg-[#FAF8F5]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Interactive Camera & Image Upload Section */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADBC8] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider">
                Fotografía del Plato
              </label>

              {photoFeedback && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {photoFeedback}
                </span>
              )}
            </div>

            {/* Live Camera Viewfinder (if active) */}
            {isCameraActive ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center shadow-lg border border-stone-800">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleToggleFacing}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cambiar Cámara</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCaptureVideoPhoto}
                      className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#9E2A2B] to-[#D4A373] text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border-2 border-white/80 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Capturar Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Photo Preview & Action Buttons */
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Thumbnail Preview */}
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative shadow-inner group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload & Camera Buttons */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Take Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleStartCamera()}
                      disabled={isUploadingImage}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#9E2A2B] to-[#B33939] hover:brightness-110 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Tomar foto con la cámara de tu móvil o webcam"
                    >
                      <Camera className="w-4 h-4 text-amber-200" />
                      <span>{isUploadingImage ? 'Procesando...' : 'Tomar Foto con Cámara'}</span>
                    </button>

                    {/* Upload File / Gallery Button */}
                    <button
                      type="button"
                      onClick={() => fileInputGalleryRef.current?.click()}
                      disabled={isUploadingImage}
                      className="px-3.5 py-2 rounded-xl bg-white border border-[#EADBC8] hover:border-[#9E2A2B] text-[#2B2523] text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Subir una foto desde tus archivos o galería"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#6E6259]" />
                      <span>Subir de Galería</span>
                    </button>

                    {/* URL Link Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-[#6E6259] hover:bg-stone-100 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Escribir o pegar una URL web de imagen"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{showUrlInput ? 'Ocultar URL' : 'Enlace web'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#6E6259]">
                    Toma una foto en directo del plato recién servido o súbela desde tu galería. La imagen se optimiza automáticamente.
                  </p>

                  {/* Optional Direct URL Input Field */}
                  {showUrlInput && (
                    <div className="relative pt-1 animate-in fade-in duration-150">
                      <ImageIcon className="w-4 h-4 text-[#6E6259] absolute left-3 top-3.5" />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Nombre del Plato *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Carrillada Ibérica al Pedro Ximénez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EADBC8] text-sm text-[#2B2523] font-semibold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Categoría en Carta *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EADBC8] text-xs font-semibold text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Price and Quantity / Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Precio (€) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#9E2A2B] absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-sm font-bold text-[#9E2A2B] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Cantidad / Formato *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Tapa, Ración, 100grs, Unidad, Copa"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs font-semibold text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_FORMATS.slice(0, 5).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                      format === f
                        ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                        : 'bg-white text-[#6E6259] border-stone-200 hover:border-[#D4A373]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
              Descripción del Plato
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe los sabores, cocción y presentación tradicional sevillana..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
            />
          </div>

          {/* Row 5: Ingredients and Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Ingredientes (separados por coma)
              </label>
              <input
                type="text"
                placeholder="Ej. Carrillada, vino tinto, cebolla caramelizada, patatas"
                value={ingredientsStr}
                onChange={(e) => setIngredientsStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Distintivo o Etiqueta (opcional)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-[#D4A373] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej. Especialidad, 100% Bellota, Más Pedido"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Availability Status */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADBC8] flex items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider">
                Disponibilidad en la Carta
              </span>
              <p className="text-[11px] text-[#6E6259]">
                Los clientes no podrán pedir este plato si está marcado como agotado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Disponible</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Agotado</span>
                </>
              )}
            </button>
          </div>

          {/* Row 7: Allergens Selector */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADBC8] space-y-2">
            <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider">
              Alérgenos e Intolerancias (Normativa UE)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ALLERGENS.map((allergen) => {
                const isSelected = selectedAllergens.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9E2A2B] text-white border-[#9E2A2B] shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#6E6259] border-[#EADBC8] hover:border-[#D4A373]'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{allergen}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-between gap-3">
            <div>
              {mode === 'edit' && product && onRequestDelete && (
                <button
                  type="button"
                  onClick={() => onRequestDelete(product)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar plato</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending || isUploadingImage}
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-[#EADBC8] text-xs font-semibold text-[#6E6259] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending || isUploadingImage}
                className="px-5 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isPending
                    ? 'Guardando...'
                    : mode === 'edit'
                    ? 'Guardar Cambios'
                    : 'Crear Plato'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
