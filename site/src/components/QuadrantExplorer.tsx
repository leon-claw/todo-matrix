import React, { useState } from 'react';
import { Calendar, BookOpen, Trash2, ArrowUpRight, Zap, ListTodo } from 'lucide-react';
import { useSiteContent } from '../i18n/content';

export default function QuadrantExplorer() {
  const content = useSiteContent();
  const [activeQuad, setActiveQuad] = useState<string | null>(null);

  // Map icons to the corresponding quadrant index or ID
  const getQuadrantIcon = (id: string) => {
    switch (id) {
      case 'do-first':
        return <Zap className="w-6 h-6 text-[#ef4444] animate-pulse" />;
      case 'plan':
        return <Calendar className="w-6 h-6 text-[#10b981]" />;
      case 'delegate':
        return <BookOpen className="w-6 h-6 text-[#f59e0b]" />;
      default:
        return <Trash2 className="w-6 h-6 text-[#94a3b8]" />;
    }
  };

  const getDotColor = (id: string) => {
    switch (id) {
      case 'do-first': return '#ef4444';
      case 'plan': return '#10b981';
      case 'delegate': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="w-full">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h3 className="font-display font-medium text-xs text-primary bg-primary/10 tracking-widest uppercase inline-block px-3 py-1 rounded-sm mb-4">
          {content.method_sec_badge}
        </h3>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text tracking-tight animate-fade-in-up">
          {content.method_sec_title}
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mt-4 leading-relaxed">
          {content.method_sec_desc}
        </p>
      </div>

      {/* 2x2 Large Interactive Grid Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {content.quad_list.map((quad) => {
          const isActive = activeQuad === quad.id;
          const isAnyActive = activeQuad !== null;

          // Compute exact custom hover layouts
          let hoverBorder = 'border-brand-border hover:border-slate-300 hover:shadow-lg';
          if (isActive) {
            if (quad.id === 'do-first') hoverBorder = 'border-rose-300 shadow-xl ring-2 ring-rose-500/10 scale-102';
            else if (quad.id === 'plan') hoverBorder = 'border-emerald-300 shadow-xl ring-2 ring-emerald-500/10 scale-102';
            else if (quad.id === 'delegate') hoverBorder = 'border-amber-300 shadow-xl ring-2 ring-amber-500/10 scale-102';
            else hoverBorder = 'border-slate-400 shadow-xl ring-2 ring-slate-400/10 scale-102';
          }

          return (
            <div
              key={quad.id}
              onMouseEnter={() => setActiveQuad(quad.id)}
              onMouseLeave={() => setActiveQuad(null)}
              className={`bg-white border rounded-lg p-6 sm:p-8 transition-all duration-300 cursor-pointer flex flex-col justify-between h-[360px] ${hoverBorder} ${
                isAnyActive && !isActive ? 'opacity-50 scale-98 blur-[0.5px]' : 'opacity-100'
              }`}
            >
              {/* Top Row: Quadrant Badge & Icon */}
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-400 uppercase tracking-widest block">
                    {content.ui.quadrant.labels[quad.id]}
                  </span>
                  
                  <div className={`p-2.5 rounded-lg ${
                    quad.id === 'do-first' ? 'bg-rose-50' : 
                    quad.id === 'plan' ? 'bg-emerald-50' : 
                    quad.id === 'delegate' ? 'bg-amber-50' : 
                    'bg-slate-50'
                  }`}>
                    {getQuadrantIcon(quad.id)}
                  </div>
                </div>

                {/* Title and descriptions */}
                <h3 className="font-display font-bold text-xl sm:text-2xl text-brand-text mt-4">
                  {quad.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-primary/70 font-sans font-medium mt-1">
                  {content.ui.quadrant.actionLabel}: {quad.action}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-3 leading-relaxed">
                  {quad.desc}
                </p>
              </div>

              {/* Bottom Row: Context Work Examples inside App */}
              <div className="pt-5 border-t border-brand-border/50">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ListTodo className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                    {content.ui.quadrant.examplesLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(quad.examples || []).map((taskName, idx) => (
                    <div
                      key={idx}
                      className={`text-xs px-3 py-1 rounded-sm border font-medium flex items-center space-x-1.5 transition-colors ${
                        quad.id === 'do-first' ? 'bg-rose-50 text-rose-800 border-rose-200/60' :
                        quad.id === 'plan' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' :
                        quad.id === 'delegate' ? 'bg-amber-50 text-amber-800 border-amber-200/60' :
                        'bg-slate-50 text-slate-800 border-slate-200/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getDotColor(quad.id) }} />
                      <span>{taskName}</span>
                    </div>
                  ))}
                  
                  {/* Subtle link arrow indicator on hover */}
                  <div className={`text-xs ml-auto items-center text-gray-400 font-medium transition-all ${isActive ? 'translate-x-1 opacity-100 flex' : 'opacity-0 hidden'}`}>
                    <span>{content.ui.quadrant.goToAxis}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
