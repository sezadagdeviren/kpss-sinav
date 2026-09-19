import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import type { Question } from '../../types';

interface QuestionDisplayProps {
  currentQuestion: Question;
  questionTime?: number;
}

export function QuestionDisplay({ currentQuestion, questionTime = 0 }: QuestionDisplayProps) {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [baseClass, setBaseClass] = useState<string>('max-w-full max-h-[90%] object-contain');

  const containerRef = useRef<HTMLDivElement>(null);

  // Soru değiştiğinde Zoom ve Pozisyonu sıfırla
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setBaseClass('max-w-full max-h-[90%] object-contain');
  }, [currentQuestion?.id, currentQuestion?.soru_resmi]);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    const { naturalWidth } = img;

    if (naturalWidth > 0 && naturalWidth < 550) {
      setBaseClass('w-full max-w-[850px] max-h-[82%] object-contain my-auto');
    } else if (naturalWidth >= 550 && naturalWidth < 750) {
      setBaseClass('w-full max-w-[900px] max-h-[85%] object-contain my-auto');
    } else {
      setBaseClass('max-w-full max-h-[90%] object-contain my-auto');
    }
  };

  // Zoom Butonları
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const zoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.25, 0.75);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Sürükleme Olayları (Pan)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Sadece sol tık
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch / Dokunmatik Desteği
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Wheel / Fare Tekerleği Yakınlaştırma
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative select-none">
      {/* Meta badges & Zoom Controls */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2.5 flex-wrap flex-shrink-0 border-b border-white/5 relative z-20 bg-slate-900/60 backdrop-blur-md">
        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${currentQuestion?.zorluk_seviyesi === 'Zor' ? 'bg-rose-500/15 text-rose-400' : currentQuestion?.zorluk_seviyesi === 'Kolay' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
          {currentQuestion?.zorluk_seviyesi || 'Orta'}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-indigo-500/15 text-indigo-400">
          {currentQuestion?.kategori}
        </span>
        <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-white/5 text-slate-500">
          {currentQuestion?.yil}
        </span>
        {currentQuestion?.konu && (
          <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-white/5 text-slate-400">
            {currentQuestion.konu}
          </span>
        )}
        {currentQuestion?.alt_konu && (
          <span className="px-2.5 py-1 rounded-md text-[9px] font-bold bg-violet-500/15 text-violet-400 border border-violet-500/10">
            {currentQuestion.alt_konu}
          </span>
        )}

        {/* Soru Bazlı Süre Rozeti */}
        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
          <span>⏱️</span>
          <span>{formatSeconds(questionTime)}</span>
        </span>

        {/* Gelismis Büyüteç ve Pan Kontrol Grubu (+ / - / Reset) */}
        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10 ml-auto sm:ml-0">
          <button
            onClick={zoomOut}
            title="Uzaklaştır (-)"
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-white/5 hover:bg-white/20 active:bg-white/30 text-slate-200 transition-colors cursor-pointer"
          >
            -
          </button>
          <button
            onClick={resetZoom}
            title="Sıfırla (%100)"
            className="px-2 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-white/5 hover:bg-white/20 active:bg-white/30 text-indigo-300 transition-colors cursor-pointer"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            title="Yakınlaştır (+)"
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-black bg-white/5 hover:bg-white/20 active:bg-white/30 text-slate-200 transition-colors cursor-pointer"
          >
            +
          </button>
        </div>

        <span className="ml-auto text-[9px] font-black text-slate-600 tracking-widest hidden sm:inline">SORU {currentQuestion?.soru_no}</span>
      </div>

      {/* Question Image Container - Pan & Drag Enabled */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`flex-1 flex items-center justify-center px-4 pt-4 pb-4 min-h-0 overflow-hidden relative z-10 ${
          isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-grab'
        }`}
      >
        {currentQuestion ? (
          <img 
            src={api.getImageUrl(currentQuestion.soru_resmi)} 
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className={`${baseClass} drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)] pointer-events-auto`} 
            alt={`Soru ${currentQuestion.soru_no}`} 
          />
        ) : null}
      </div>
    </div>
  );
}
