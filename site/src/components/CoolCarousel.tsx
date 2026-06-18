import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Monitor, Smartphone, SlidersHorizontal } from 'lucide-react';

import desktopHomeImg from '../assets/images/carousel-desktop-home.png';
import mobileHomeImg from '../assets/images/carousel-mobile-home.png';
import editFlowImg from '../assets/images/carousel-edit-flow.png';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  image: string;
}

const slides: Slide[] = [
  {
    id: 0,
    badge: '桌面矩阵 · DESKTOP',
    title: '在大屏上看清任务位置',
    subtitle: '重要度与紧急度组成坐标轴，任务落在矩阵里的哪个位置，优先级就一眼清楚。',
    icon: <Monitor className="w-5 h-5 text-blue-600" />,
    image: desktopHomeImg,
  },
  {
    id: 1,
    badge: '移动端矩阵 · MOBILE',
    title: '手机上也能整理优先级',
    subtitle: '随时查看任务、切换筛选、隐藏坐标轴，在碎片时间里也能把事情重新排好。',
    icon: <Smartphone className="w-5 h-5 text-emerald-600" />,
    image: mobileHomeImg,
  },
  {
    id: 2,
    badge: '重要度 × 紧急度',
    title: '调整两个数值，任务重新排序',
    subtitle: '在编辑页修改重要度、紧急度、进度和子待办，保存后任务会回到新的矩阵位置。',
    icon: <SlidersHorizontal className="w-5 h-5 text-indigo-600" />,
    image: editFlowImg,
  },
];

export default function CoolCarousel() {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const getCardStyle = (cardIndex: number) => {
    const diff = (cardIndex - index + slides.length) % slides.length;

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
      <div
        className="relative w-full overflow-visible py-8 flex flex-col items-center justify-center min-h-[460px] sm:min-h-[580px]"
        style={{ perspective: '1200px' }}
      >
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 z-40 bg-white/90 hover:bg-white border border-brand-border hover:border-slate-400 p-2.5 sm:p-3 rounded-full shadow-md text-gray-700 hover:text-primary hover:scale-105 transition-all duration-200 cursor-pointer"
          aria-label="上一张"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

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
                <div className="relative w-full h-full group bg-slate-900 overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isActive ? 'scale-101 group-hover:scale-105' : 'scale-98 brightness-95'
                    }`}
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 border-[6px] border-black/5 rounded-2xl pointer-events-none z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent opacity-80 pointer-events-none z-10" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-6 z-40 bg-white/90 hover:bg-white border border-brand-border hover:border-slate-400 p-2.5 sm:p-3 rounded-full shadow-md text-gray-700 hover:text-primary hover:scale-105 transition-all duration-200 cursor-pointer"
          aria-label="下一张"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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

        <div className="flex justify-center space-x-2 mt-6">
          {slides.map((slide) => (
            <button
              key={slide.id}
              onClick={() => setIndex(slide.id)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slide.id === index ? 'w-7 bg-primary shadow-xs' : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`查看第 ${slide.id + 1} 张`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
