/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  User,
  ShoppingCart,
  Menu,
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
  Sparkles,
  Lock,
  Truck,
  MapPin,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  Droplets,
  CircleCheck,
  ShieldAlert,
  Mail,
  X,
  Minus,
  Plus,
  Home,
  ShoppingBag,
} from 'lucide-react';
import { PRODUCTS, REVIEWS } from './data';
import { ProductOption, ViaCepResponse } from './types';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function App() {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cepInput, setCepInput] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [cepData, setCepData] = useState<ViaCepResponse | null>(null);
  const [isCalculatingCep, setIsCalculatingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [selectedCepShipping, setSelectedCepShipping] = useState<'pac' | 'sedex'>('pac');

  const currentProduct: ProductOption =
    PRODUCTS.find((p) => p.qty === selectedQty) || PRODUCTS[0];
  const totalPrice = selectedQty * currentProduct.price;
  const originalPrice = 48.97 * selectedQty;
  const currentGallery =
    currentProduct.gallery && currentProduct.gallery.length > 0
      ? currentProduct.gallery
      : [
          currentProduct.image,
          '/images/Ao6WGHw.webp',
          '/images/rT7H2fb.webp',
          '/images/6x2uk0n.webp',
          '/images/tYigk7Z.webp',
        ];

  const touchStartXRef = useRef<number | null>(null);
  const prefetchedUrlsRef = useRef<Set<string>>(new Set());

  const targetCheckoutUrl = useMemo(() => {
    let url = currentProduct.checkoutUrl;
    if (typeof window !== 'undefined' && window.location.search) {
      const search = window.location.search.replace(/^\?/, '');
      if (search) {
        url = url.includes('?') ? `${url}&${search}` : `${url}?${search}`;
      }
    }
    return url;
  }, [currentProduct.checkoutUrl]);

  const prefetchUrl = useCallback((url: string) => {
    if (typeof document === 'undefined' || prefetchedUrlsRef.current.has(url)) return;
    prefetchedUrlsRef.current.add(url);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = url;
    document.head.appendChild(link);

    // Also update speculation rules for Chromium instant navigation
    try {
      const existing = document.getElementById('dynamic-checkout-speculation');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.id = 'dynamic-checkout-speculation';
      script.type = 'speculationrules';
      script.textContent = JSON.stringify({
        prefetch: [{ source: 'list', urls: [url], eagerness: 'eager' }],
      });
      document.head.appendChild(script);
    } catch {
      // Ignore on unsupported browsers
    }
  }, []);

  // Warm up current checkout URL as soon as selectedQty changes
  useEffect(() => {
    prefetchUrl(targetCheckoutUrl);
  }, [targetCheckoutUrl, prefetchUrl]);

  // Preload all gallery & review WebP images right after first paint so carousel & scroll are 0ms
  useEffect(() => {
    const preloadSecondary = () => {
      const allImagesToPreload = Array.from(
        new Set([
          ...PRODUCTS.flatMap((p) => p.gallery),
          ...REVIEWS.flatMap((r) => r.photos || []),
          ...REVIEWS.map((r) => r.avatar).filter((avatar): avatar is string => Boolean(avatar)),
        ])
      );

      allImagesToPreload.forEach((src) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(preloadSecondary, { timeout: 300 });
    } else {
      setTimeout(preloadSecondary, 150);
    }
  }, []);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % currentGallery.length);
  };

  const prevImage = () => {
    setActiveImageIndex(
      (prev) => (prev - 1 + currentGallery.length) % currentGallery.length
    );
  };

  const handleCalculateCep = async () => {
    if (cepInput.length === 8) {
      setIsCalculatingCep(true);
      setCepError(null);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepInput}/json/`);
        const data = await response.json();
        if (data.erro) {
          setCepData(null);
          setCepError('CEP não encontrado. Por favor, confira os números digitados.');
        } else {
          setCepData(data);
          setSelectedCepShipping('pac');
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
        setCepError('Erro ao consultar CEP. Tente novamente.');
      } finally {
        setIsCalculatingCep(false);
      }
    }
  };

  const handleBuyNow = () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: currentProduct.name,
        content_category: 'Body Splash',
        content_ids: ['body-splash-001'],
        content_type: 'product',
        value: totalPrice,
        currency: 'BRL',
      });
      window.fbq('track', 'InitiateCheckout', {
        content_name: currentProduct.name,
        content_category: 'Body Splash',
        value: totalPrice,
        currency: 'BRL',
        num_items: selectedQty,
      });
    }

    // Navega imediatamente para o checkout já pré-carregado
    window.location.assign(targetCheckoutUrl);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-brand-support font-sans">
      {/* Prime Store Header in Pink (Conforme imagem) */}
      <header className="bg-gradient-to-r from-brand-accent to-[#A63A54] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          {/* Left: Menu & Search */}
          <div className="flex items-center gap-1.5 sm:gap-2 z-10">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir Menu"
              className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="w-6 h-6 text-white stroke-[2.2]" />
            </button>
            <button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              aria-label="Pesquisar"
              className="p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5 text-white stroke-[2.2]" />
            </button>
          </div>

          {/* Center: PRIME STORE Logo truly centered in the header */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center select-none cursor-pointer whitespace-nowrap">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3.5 sm:w-5 h-[1.5px] bg-white/70" />
              <span className="text-white font-black text-sm sm:text-base tracking-[0.25em] pl-[0.25em] uppercase font-sans text-center">
                PRIME
              </span>
              <div className="w-3.5 sm:w-5 h-[1.5px] bg-white/70" />
            </div>
            <div className="flex items-center justify-center gap-1.5 -mt-0.5">
              <div className="w-5 sm:w-7 h-[1px] bg-white/50" />
              <span className="text-white font-bold text-[8px] sm:text-[9px] tracking-[0.35em] pl-[0.35em] uppercase font-sans text-center">
                STORE
              </span>
              <div className="w-5 sm:w-7 h-[1px] bg-white/50" />
            </div>
          </div>

          {/* Right: Shopping Bag */}
          <div className="flex items-center">
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Carrinho"
              className="relative p-1.5 text-white hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center"
            >
              <ShoppingBag className="w-6 h-6 text-white stroke-[2]" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0 bg-[#00A650] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchOpen && (
          <div className="overflow-hidden bg-black/10 px-4 py-2 border-t border-white/10">
            <div className="max-w-xl mx-auto relative">
              <input
                placeholder="O que você está procurando hoje?"
                className="w-full bg-white text-gray-800 rounded-full py-2 px-4 pl-10 text-xs focus:outline-none shadow-sm"
                type="text"
                autoFocus
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
        )}
      </header>

      {/* Breadcrumb Navigation (Conforme imagem) */}
      <div className="bg-white border-b border-gray-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 text-xs text-gray-500 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
            <Home className="w-3.5 h-3.5" />
            <span>Início</span>
          </div>
          <span className="text-gray-300">›</span>
          <span className="text-gray-400 shrink-0">Perfumaria &amp; Beleza</span>
          <span className="text-gray-300">›</span>
          <span className="font-semibold text-gray-700 truncate max-w-[200px] sm:max-w-none">
            {currentProduct.name}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
          {/* Left Column: Product Images Carousel */}
          <div className="lg:col-span-7 space-y-3.5">
            <div
              className="relative aspect-[9/10] max-w-[348px] sm:max-w-[380px] mx-auto bg-white overflow-hidden group rounded-lg border border-gray-100 shadow-sm"
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current === null) return;
                const deltaX = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
                touchStartXRef.current = null;
                if (deltaX > 50) prevImage();
                else if (deltaX < -50) nextImage();
              }}
            >
              <img
                key={currentGallery[activeImageIndex]}
                alt="Product Image"
                className="w-full h-full object-contain p-1 select-none transition-opacity duration-150"
                src={currentGallery[activeImageIndex]}
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="sync"
                fetchPriority="high"
              />

              {/* Prev/Next Buttons */}
              <button
                aria-label="Imagem Anterior"
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                aria-label="Próxima Imagem"
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden md:block cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex justify-center gap-2 overflow-x-auto py-1">
              {currentGallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 w-14 aspect-square border-2 transition-all rounded-md overflow-hidden cursor-pointer bg-white ${
                    activeImageIndex === idx
                      ? 'border-brand-accent'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover"
                    src={imgUrl}
                    referrerPolicy="no-referrer"
                    loading="eager"
                    decoding="async"
                  />
                </button>
              ))}
            </div>

            {/* Stock Scarcity Bar */}
            <div className="max-w-[348px] sm:max-w-[380px] mx-auto w-full mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                    93% VENDIDO
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                  ÚLTIMAS UNIDADES
                </span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                <div
                  style={{ width: '93%' }}
                  className="h-full bg-gradient-to-r from-brand-accent to-[#A63A54] rounded-full shadow-sm relative transition-all duration-1000 ease-out"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Product Details, Kit Selection, Actions */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Rating and Title */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                  782 Avaliações
                </span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-600 font-bold uppercase tracking-tighter">
                  +18.8k Vendidos
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold uppercase mb-2 leading-tight text-brand-dark">
                {currentProduct.name}
              </h2>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                Fragrância Exclusiva • Edição Limitada
              </p>

              {/* Price Details */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-gray-400 line-through text-lg">
                  R$ {originalPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-3xl font-bold text-brand-accent">
                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                </span>
              </div>

              {/* Economy Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <p className="text-sm text-green-600 font-bold flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  Economia de R$ {(originalPrice - totalPrice).toFixed(2).replace('.', ',')} (
                  {Math.round((1 - totalPrice / originalPrice) * 100)}% OFF)
                </p>
              </div>
            </div>

            {/* Kit Selection */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px bg-gray-100 flex-grow" />
                <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-accent/5 rounded-full border border-brand-accent/10">
                  <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
                  <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest">
                    Dica: Escolha um Kit e experimente todas as fragrâncias
                  </span>
                </div>
                <div className="h-px bg-gray-100 flex-grow" />
              </div>

              {/* 3 Kit Cards */}
              <div className="grid grid-cols-3 gap-3">
                {PRODUCTS.map((prod) => (
                  <button
                    key={prod.qty}
                    onClick={() => {
                      setSelectedQty(prod.qty);
                      setActiveImageIndex(0);
                    }}
                    className={`relative group flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                      selectedQty === prod.qty
                        ? 'border-brand-accent bg-brand-accent/5'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {prod.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-widest shadow-sm">
                        {prod.badge}
                      </span>
                    )}
                    <div className="w-12 h-14 mb-2 overflow-hidden rounded-lg bg-white flex items-center justify-center p-1 border border-gray-50 shadow-sm transition-transform group-hover:scale-110">
                      <img
                        src={prod.image}
                        alt={prod.label}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase mb-1.5 ${
                        selectedQty === prod.qty ? 'text-brand-accent' : 'text-gray-400'
                      }`}
                    >
                      {prod.label}
                    </span>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm font-black text-brand-dark leading-none">
                        R$ {prod.price.toFixed(2).replace('.', ',')}
                      </span>
                      {prod.qty > 1 && (
                        <span className="text-[8px] text-gray-500 font-black uppercase leading-none mt-1">
                          cada
                        </span>
                      )}
                      {prod.description && (
                        <span className="text-[7px] text-brand-accent font-black uppercase mt-2 text-center leading-tight">
                          {prod.description}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Buy Now CTA Button */}
            <div className="flex flex-col gap-3 mb-8">
              <button
                onMouseEnter={() => prefetchUrl(targetCheckoutUrl)}
                onTouchStart={() => prefetchUrl(targetCheckoutUrl)}
                onClick={handleBuyNow}
                className="w-full bg-gradient-to-r from-brand-accent to-[#A63A54] text-white py-5 rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-brand-accent/30 flex items-center justify-center gap-3 text-lg cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingCart className="w-[22px] h-[22px]" />
                Comprar Agora
              </button>
            </div>

            {/* Volume Total & Included Fragrances */}
            <div className="mb-6 bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100 flex flex-col items-center shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
                Volume Total
              </span>
              <div className="bg-white px-8 py-3 rounded-2xl shadow-sm border border-brand-accent/20 mb-6">
                <span className="text-sm font-bold text-brand-dark">
                  {selectedQty * 200}ml ({selectedQty}x 200ml)
                </span>
              </div>
              <div className="w-full h-px bg-gray-200/50 mb-6" />

              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
                Fragrâncias no Kit
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {selectedQty === 1 ? (
                  <span className="bg-brand-dark text-white text-[10px] font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-sm">
                    My Sweet Delight
                  </span>
                ) : selectedQty === 2 ? (
                  <>
                    <span className="bg-brand-dark text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                      My Sweet Delight
                    </span>
                    <span className="bg-brand-accent text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                      Roses
                    </span>
                  </>
                ) : (
                  <>
                    <span className="bg-brand-dark text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                      My Sweet Delight
                    </span>
                    <span className="bg-brand-accent text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                      Very Sexy
                    </span>
                    <span className="bg-[#A63A54] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
                      Roses
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* 100% Secure Payment Badge */}
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-8">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Pagamento 100% Seguro e Criptografado
              </span>
            </div>

            {/* Shipping Calculator */}
            <div className="mb-8 border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-gray-900">
                <Truck className="text-brand-accent w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Calcular Frete
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  maxLength={8}
                  placeholder="00000-000"
                  className="flex-grow border-2 border-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors"
                  type="text"
                  value={cepInput}
                  onChange={(e) => {
                    setCepInput(e.target.value.replace(/\D/g, ''));
                    if (cepError) setCepError(null);
                  }}
                />
                <button
                  onClick={handleCalculateCep}
                  disabled={isCalculatingCep || cepInput.length !== 8}
                  className="bg-brand-dark text-white px-6 py-2 rounded-lg text-xs font-bold uppercase hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isCalculatingCep ? '...' : 'Calcular'}
                </button>
              </div>
              {cepError && (
                <p className="text-xs text-red-500 mb-3 font-medium">{cepError}</p>
              )}

              {/* CEP Result Details */}
              {cepData && (
                <div className="space-y-4 overflow-hidden mt-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-brand-accent mt-0.5" />
                        <div className="text-xs text-gray-600">
                          <p className="font-bold text-gray-900">{cepData.logradouro}</p>
                          <p>{cepData.bairro}</p>
                          <p>
                            {cepData.localidade} - {cepData.uf}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {/* Opção 1: PAC */}
                      <div
                        onClick={() => setSelectedCepShipping('pac')}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedCepShipping === 'pac'
                            ? 'border-2 border-brand-accent bg-brand-accent/5 shadow-xs'
                            : 'border border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center shrink-0">
                            {selectedCepShipping === 'pac' ? (
                              <div className="w-5 h-5 rounded-full border-2 border-brand-accent flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                              Frete Rápido - PAC
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              5 a 7 dias (dias úteis)
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">R$ 7,21</span>
                      </div>

                      {/* Opção 2: Sedex */}
                      <div
                        onClick={() => setSelectedCepShipping('sedex')}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedCepShipping === 'sedex'
                            ? 'border-2 border-brand-accent bg-brand-accent/5 shadow-xs'
                            : 'border border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center shrink-0">
                            {selectedCepShipping === 'sedex' ? (
                              <div className="w-5 h-5 rounded-full border-2 border-brand-accent flex items-center justify-center">
                                <div className="w-2.5 h-2.5 rounded-full bg-brand-accent" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">
                                Sedex
                              </p>
                              <span className="bg-[#FFC700] text-[#002D52] font-black italic text-[9px] px-1.5 py-0.2 rounded uppercase leading-none">
                                SEDEX
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              2 a 4 dias (dias úteis)
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">R$ 12,41</span>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase text-center justify-center border border-gray-100 p-2 rounded">
                <ShieldCheck className="text-green-500 w-5 h-5" />
                Compra Segura
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase text-center justify-center border border-gray-100 p-2 rounded">
                <Truck className="text-blue-500 w-5 h-5" />
                Envio Imediato
              </div>
            </div>

            {/* MercadoLíder Platinum Card */}
            <div className="mb-8 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-12 bg-white flex items-center justify-center border border-gray-100 rounded-lg p-1">
                  <img
                    src="/images/5zDxgo0.webp"
                    alt="Mercado Pago Platinum"
                    className="w-full h-auto object-contain"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#00A650] leading-none uppercase tracking-tight">
                    MercadoLíder Platinum
                  </h4>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-1">
                    Um dos melhores sites!
                  </p>
                </div>
              </div>

              {/* 5-step reputation bar */}
              <div className="grid grid-cols-5 gap-1.5 mb-8">
                <div className="h-1.5 bg-[#FFF1F1] rounded-full" />
                <div className="h-1.5 bg-[#FFF7E8] rounded-full" />
                <div className="h-1.5 bg-[#FFFFE0] rounded-full" />
                <div className="h-1.5 bg-[#F1FFF1] rounded-full" />
                <div className="h-1.5 bg-[#00A650] rounded-full shadow-[0_0_8px_rgba(0,166,80,0.3)]" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center border-r border-gray-100 px-1">
                  <p className="text-xl font-bold text-gray-900 leading-none">18.824</p>
                  <p className="text-[7px] font-bold text-gray-400 uppercase leading-tight mt-1.5">
                    Vendas nos últimos 60 dias
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center px-1 border-r border-gray-100">
                  <MessageSquare className="w-5 h-5 text-[#00A650] mb-1.5" />
                  <p className="text-[7px] font-bold text-gray-400 uppercase leading-tight text-center">
                    Presta bom atendimento
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center px-1">
                  <RefreshCw className="w-5 h-5 text-[#00A650] mb-1.5" />
                  <p className="text-[7px] font-bold text-gray-400 uppercase leading-tight text-center">
                    Entrega no prazo
                  </p>
                </div>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-gray-100 divide-y divide-gray-100">
              {/* Product Description */}
              <details className="py-4 group" open>
                <summary className="flex justify-between items-center cursor-pointer list-none text-xs font-bold uppercase tracking-widest text-gray-900">
                  Descrição do Produto
                  <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform text-gray-400" />
                </summary>
                <div className="pt-4 text-sm text-gray-600 leading-relaxed">
                  {selectedQty === 1
                    ? 'O Body Splash My Sweet Delight da Barbour’s Beauty é uma celebração da feminilidade e do frescor. Com uma fragrância envolvente e toque suave, este desodorante colônia de 200ml foi desenvolvido para proporcionar uma sensação prolongada de pós-banho.'
                    : selectedQty === 2
                    ? 'Este Kit Duplo exclusivo combina a doçura do My Sweet Delight com a elegância clássica do Roses. Perfeito para quem deseja variar entre uma fragrância frutada/doce e um bouquet floral sofisticado. Dois frascos de 200ml para garantir que você esteja sempre perfumada.'
                    : 'O Kit Premium com 3 unidades oferece a experiência completa Barbour’s. Com as fragrâncias Delight, Very Sexy e Roses, você terá o aroma perfeito para cada momento: do dia a dia refrescante à noite mais envolvente. Três frascos de luxo que somam 600ml de puro frescor.'}
                </div>
              </details>

              {/* Technical Specifications */}
              <details className="py-5 group">
                <summary className="flex justify-between items-center cursor-pointer list-none text-sm font-bold uppercase tracking-widest text-gray-900">
                  Especificações Técnicas
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-accent font-bold animate-pulse">
                      VER DETALHES
                    </span>
                    <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform text-brand-accent" />
                  </div>
                </summary>
                <div className="pt-4 text-sm text-gray-600 space-y-2">
                  <p>• Volume Total: {selectedQty * 200}ml</p>
                  <p>• Itens: {selectedQty} Frascos de 200ml</p>
                  <p>• Fragrâncias: {currentProduct.description}</p>
                  <p>• Tipo: Body Splash / Desodorante Colônia</p>
                  <p>• Duração: Alta fixação e frescor prolongado</p>
                  <p>• Indicação: Uso corporal pós-banho</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Fragrance Notes / Fragrances Included Section */}
        <section className="mt-12 flex flex-col items-center">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-brand-dark">
            {selectedQty === 1 ? 'Notas da Fragrância' : 'Fragrâncias Inclusas'}
          </h3>

          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedQty === 1
              ? [
                  { title: 'Topo', desc: 'Frutas Vermelhas e Cítrico.' },
                  { title: 'Corpo', desc: 'Buquê Floral e Jasmim.' },
                  { title: 'Fundo', desc: 'Baunilha e Almíscar.' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center"
                  >
                    <div className="w-10 h-10 bg-brand-support rounded-full flex items-center justify-center mx-auto mb-2 text-brand-accent">
                      <Star className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold uppercase text-[10px] mb-1 text-brand-dark">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p>
                  </div>
                ))
              : selectedQty === 2
              ? [
                  { title: 'My Sweet Delight', desc: 'Doce, Frutado e Sensual.' },
                  { title: 'Roses', desc: 'Floral, Elegante e Atemporal.' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center ${
                      idx === 0 ? 'md:col-span-1' : 'md:col-span-2'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 ${
                        idx === 0 ? 'bg-brand-dark' : 'bg-brand-accent'
                      } text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md`}
                    >
                      <Droplets className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold uppercase text-xs mb-2 text-brand-dark">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight uppercase tracking-widest font-medium">
                      {item.desc}
                    </p>
                  </div>
                ))
              : [
                  { title: 'Delight', desc: 'Docura Irresistível.' },
                  { title: 'Very Sexy', desc: 'Mistério e Atração.' },
                  { title: 'Roses', desc: 'Elegância Floral.' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center"
                  >
                    <div
                      className={`w-10 h-10 ${
                        idx === 0
                          ? 'bg-brand-dark'
                          : idx === 1
                          ? 'bg-[#A63A54]'
                          : 'bg-brand-accent'
                      } text-white rounded-full flex items-center justify-center mx-auto mb-3`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold uppercase text-[10px] mb-1 text-brand-dark">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 leading-tight font-bold">
                      {item.desc}
                    </p>
                  </div>
                ))}
          </div>
        </section>

        {/* Highlights Section */}
        <section className="mt-12 border-t border-gray-100 pt-8">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-center text-brand-dark">
            Destaques
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Star, title: 'Exclusiva', desc: 'Perfume Único.' },
              { icon: ShieldCheck, title: 'Proteção', desc: 'Ação Desodorante.' },
              { icon: ThumbsUp, title: 'Toque', desc: 'Pele Macia.' },
              { icon: CircleCheck, title: '200ml', desc: 'Volume Ideal.' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="w-10 h-10 bg-brand-accent text-white rounded-full flex items-center justify-center mb-3 shadow-lg shadow-brand-accent/20">
                  <item.icon className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-brand-dark">
                  {item.title}
                </p>
                <p className="text-[9px] text-gray-500 leading-tight">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quality Seal Section */}
        <section className="mt-12 max-w-2xl mx-auto px-4">
          <div className="bg-white border border-brand-accent/20 rounded-xl p-6 text-center relative overflow-hidden shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="w-12 h-12 bg-brand-accent text-white rounded-full flex-shrink-0 flex items-center justify-center shadow-lg shadow-brand-accent/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-1 text-brand-dark">
                  Selo de Qualidade
                </h3>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Garantimos a{' '}
                  <span className="font-bold text-brand-accent">devolução total</span> em até 7
                  dias se não atender suas expectativas. Satisfação garantida ou seu dinheiro de
                  volta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews Section */}
        <section className="mt-20 border-t border-gray-100 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-10 gap-4">
            <h3 className="text-3xl font-bold uppercase tracking-tighter text-brand-dark">
              O que nossos clientes dizem
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-[18px] h-[18px] fill-current" />
                ))}
              </div>
              <span className="text-lg font-bold">4.9 / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {REVIEWS.map((rev, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      {rev.avatar ? (
                        <img
                          className="w-12 h-12 rounded-full object-cover border-2 border-brand-support shadow-sm"
                          alt={rev.name}
                          src={rev.avatar}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white text-brand-dark flex items-center justify-center font-bold text-lg border-2 border-brand-support shadow-sm">
                          {rev.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-brand-dark text-base uppercase">
                          {rev.name}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                          {rev.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 italic leading-relaxed mb-6">
                    "{rev.text}"
                  </p>

                  {/* Review Photos */}
                  {rev.photos && rev.photos.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {rev.photos.map((photoUrl, photoIdx) => (
                        <button
                          key={photoIdx}
                          onClick={() => setSelectedPhoto(photoUrl)}
                          className="group flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-100 hover:border-black transition-all cursor-zoom-in"
                        >
                          <img
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt=""
                            src={photoUrl}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase mt-4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Compra Verificada
                </div>
              </div>
            ))}
          </div>

          {/* Prime Store Brand Mission */}
          <div className="mt-8 text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                <img
                  alt="Logo Prime Store"
                  className="w-8 h-auto"
                  src="/images/DGHgEP3.webp"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h4 className="text-xl font-bold uppercase tracking-widest text-brand-dark">
                PRIME STORE
              </h4>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Nossa missão é oferecer o melhor custo-benefício do mercado brasileiro. Unimos
              tecnologia têxtil de ponta com design moderno para garantir que você tenha o melhor
              produto pelo menor preço possível. Qualidade premium acessível a todos.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-8 border-t border-gray-100 pt-8 pb-12">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-widest mb-4">Fale Conosco</h3>
              <p className="text-sm text-gray-500 mb-6">
                Dúvidas sobre seu pedido ou sobre nossos produtos? Estamos aqui para ajudar!
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">E-mail</p>
                    <p className="text-sm font-bold">contato@primestore.com.br</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark text-white pt-12 pb-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & About */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                <img
                  alt="Logo Prime Store"
                  className="w-8 h-auto"
                  src="/images/DGHgEP3.webp"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-tighter">PRIME STORE</h1>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Elevando sua autoestima através de fragrâncias exclusivas e momentos de autocuidado.
            </p>
            <div className="flex gap-4">
              <button
                aria-label="Email"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-accent transition-all cursor-pointer"
              >
                <Mail className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* Institutional Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-8 text-brand-accent">
              Institucional
            </h4>
            <ul className="text-sm text-gray-400 space-y-4">
              {['Nossa História', 'Trabalhe Conosco', 'Sustentabilidade', 'Blog da Prime'].map(
                (item, idx) => (
                  <li key={idx}>
                    <button className="hover:text-brand-accent transition-colors cursor-pointer">
                      {item}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-8 text-brand-accent">
              Suporte
            </h4>
            <ul className="text-sm text-gray-400 space-y-4">
              {['Trocas e Devoluções', 'Prazos de Entrega', 'Meios de Pagamento', 'Fale Conosco'].map(
                (item, idx) => (
                  <li key={idx}>
                    <button className="hover:text-brand-accent transition-colors cursor-pointer">
                      {item}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal for Review Photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            aria-label="Fechar"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Foto da avaliação"
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Cart Drawer (Right) */}
      {isCartOpen && (
        <>
          <div
            className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[96] bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-brand-accent" />
                <h3 className="text-lg font-bold uppercase tracking-widest">Seu Carrinho</h3>
              </div>
              <button
                aria-label="Fechar Carrinho"
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              {cartCount > 0 ? (
                <div className="space-y-6">
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <img
                      src={currentGallery[0]}
                      alt="Carrinho"
                      className="w-20 h-24 object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow">
                      <p className="text-xs font-bold text-gray-900 uppercase leading-tight mb-1">
                        Body Splash My Sweet Delight
                      </p>
                      <p className="text-sm font-bold text-brand-accent mb-3">
                        R$ {currentProduct.price.toFixed(2).replace('.', ',')}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          aria-label="Diminuir"
                          onClick={() => setCartCount(Math.max(0, cartCount - 1))}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold">{cartCount}</span>
                        <button
                          aria-label="Aumentar"
                          onClick={() => setCartCount(cartCount + 1)}
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 text-brand-accent font-bold uppercase text-xs tracking-widest cursor-pointer"
                  >
                    Continuar Comprando
                  </button>
                </div>
              )}
            </div>

            {cartCount > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-500 font-medium uppercase text-xs tracking-widest">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-brand-dark">
                    R$ {(cartCount * currentProduct.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button
                  onMouseEnter={() => prefetchUrl(targetCheckoutUrl)}
                  onTouchStart={() => prefetchUrl(targetCheckoutUrl)}
                  onClick={handleBuyNow}
                  className="w-full bg-brand-accent text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-brand-accent/20 hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Menu Drawer (Left) */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-full max-w-xs z-[96] bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
                <img
                  alt="Logo Prime Store"
                  className="w-6 h-auto"
                  src="/images/DGHgEP3.webp"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <button
                aria-label="Fechar Menu"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6">
              <nav className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6">
                    Você está em:
                  </h4>
                  <div className="p-4 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100">
                      <img
                        src={currentGallery[0]}
                        alt="Produto"
                        className="w-10 h-10 object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-dark uppercase">
                        Body Splash
                      </p>
                      <p className="text-[10px] text-brand-accent font-bold uppercase">
                        My Sweet Delight
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                    Categorias
                  </h4>
                  <ul className="space-y-4">
                    {['Lançamentos', 'Body Splash', 'Perfumes', 'Skincare', 'Kits Presente'].map(
                      (cat, idx) => (
                        <li key={idx}>
                          <button
                            onClick={() => setIsMenuOpen(false)}
                            className="text-lg font-bold text-gray-900 hover:text-brand-accent transition-colors w-full text-left flex items-center justify-between group cursor-pointer"
                          >
                            <span>{cat}</span>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-accent transition-colors" />
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
