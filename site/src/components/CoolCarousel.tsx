import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Monitor, Smartphone, Layers, ShieldCheck, Sparkles } from 'lucide-react';

import desktopImg from '../assets/images/desktop_preview.jpg';
import mobileImg from '../assets/images/mobile_preview.jpg';
import ecosystemImg from '../assets/images/ecosystem_preview.jpg';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  image: string;
}

export default function CoolCarousel() {
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    {
      id: 0,
      badge: "桌面控制台 VIEWER",
      title: "十字坐标轴物理沙盒",
      subtitle: "直观在二维大尺寸屏幕交互中，按键或拖拽彩色重心，瞬间完成决策序列梳理。",
      icon: <Monitor className="w-5 h-5 text-blue-600" />,
      image: desktopImg
    },
    {
      id: 1,
      badge: "手持精炼版 INTERACTIVE",
      title: "移动手势触控面板",
      subtitle: "像素级打磨的指尖拖拽缓动公式。不论通勤还是开会，琐事一键滑过，秒速决策归仓。",
      icon: <Smartphone className="w-5 h-5 text-emerald-600" />,
      image: mobileImg
    },
    {
      id: 2,
      badge: "生态智慧盒 MULTIDIMENSIONAL",
      title: "双链卡片与时空轴联动",
      subtitle: "联动 Note Grid 知识引擎。不仅列明代办，更可关联研究文献与备忘录双链，打破信息壁垒。",
      icon: <Layers className="w-5 h-5 text-indigo-600" />,
      image: ecosystemImg
    }
  ];

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Compute indices for 3D stack carousel layout (Cover Flow style)
  const getCardStyle = (cardIndex: number) => {
    const diff = (cardIndex - index + slides.length) % slides.length;

    // Active slide
    if (diff === 0) {
      return {
        zIndex: 30,
        x: '0%',
        scale: 1,
        opacity: 1,
        rotateY: 0,
        filter: 'brightness(100%)',
      };
    }
    // Next slide (on the right)
    if (diff === 1) {
      return {
        zIndex: 20,
        x: '45%',
        scale: 0.85,
        opacity: 0.65,
        rotateY: -25,
        filter: 'brightness(75%)',
      };
    }
    // Previous slide (on the left)
    return {
      zIndex: 10,
      x: '-45%',
      scale: 0.85,
      opacity: 0.65,
      rotateY: 25,
      filter: 'brightness(75%)',
    };
  };

  return (
    <div className="w-full select-none pb-8">
      {/* 3D Scene Wrapper */}
      <div 
        className="relative w-full overflow-visible py-8 flex flex-col items-center justify-center min-h-[460px] sm:min-h-[580px]"
        style={{ perspective: '1200px' }}
      >
        {/* Navigation Arrow Left */}
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 z-40 bg-white/90 hover:bg-white border border-brand-border hover:border-slate-400 p-2.5 sm:p-3 rounded-full shadow-md text-gray-700 hover:text-primary hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Carousel Slide Cards Container */}
        <div className="relative w-full max-w-[85%] sm:max-w-[700px] aspect-[16/10] flex items-center justify-center">
          {slides.map((slide) => {
            const style = getCardStyle(slide.id);
            const isActive = slide.id === index;

            return (
              <motion.div
                key={slide.id}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  opacity: style.opacity,
                  rotateY: style.rotateY,
                  filter: style.filter,
                  zIndex: style.zIndex,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 25 }}
                onClick={() => {
                  if (!isActive) setIndex(slide.id);
                }}
                className={`absolute w-full h-full rounded-2xl bg-white border border-brand-border/60 shadow-xl overflow-hidden cursor-pointer ${
                  isActive ? 'ring-1 ring-primary/20 pointer-events-auto' : 'pointer-events-none sm:pointer-events-auto'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Visual Glassy App Screen Image inside Device frame shadow */}
                <div className="relative w-full h-full group bg-slate-900 overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isActive ? 'scale-101 group-hover:scale-105' : 'scale-98 brightness-95'
                    }`}
                    referrerPolicy="no-referrer"
                  />

                  {/* High precision edge shading overlay to simulate elegant smartphone or premium screen bezel */}
                  <div className="absolute inset-0 border-[6px] border-black/5 rounded-2xl pointer-events-none z-10" />

                  {/* Inner ambient glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-80 pointer-events-none z-10" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-6 z-40 bg-white/90 hover:bg-white border border-brand-border hover:border-slate-400 p-2.5 sm:p-3 rounded-full shadow-md text-gray-700 hover:text-primary hover:scale-105 transition-all duration-200 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Active Slide Captions Desk - Styled like premium iOS Apple Music Album detail cards */}
      <div className="max-w-2xl mx-auto text-center px-4 mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="inline-flex items-center space-x-2 bg-[#f1f5f9] border border-brand-border/60 px-3 py-1 rounded-full text-[11px] font-bold text-gray-500 font-mono tracking-widest uppercase">
              {slides[index].icon}
              <span>{slides[index].badge}</span>
            </div>
            
            <h3 className="font-display font-extrabold text-[#111827] text-2xl tracking-tight">
              {slides[index].title}
            </h3>
            
            <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto">
              {slides[index].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators dot navigation */}
        <div className="flex justify-center space-x-2 mt-6">
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => setIndex(slide.id)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide.id === index 
                  ? 'w-7 bg-primary shadow-xs' 
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
