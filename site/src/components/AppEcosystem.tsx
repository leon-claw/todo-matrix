import React from 'react';
import { LayoutGrid, NotebookPen, Clock9, Compass, ArrowUpRight, Sparkles } from 'lucide-react';
import { TODO_MATRIX_APP_URL } from '../config/urls';
import { useSiteContent } from '../i18n/content';

export default function AppEcosystem() {
  const content = useSiteContent();
  const getSuiteIcon = (id: string) => {
    switch (id) {
      case 'todo-matrix':
        return <LayoutGrid className="w-6 h-6 text-white" />;
      case 'note-grid':
        return <NotebookPen className="w-5 h-5 text-emerald-500" />;
      case 'time-axis':
        return <Clock9 className="w-5 h-5 text-amber-500" />;
      default:
        return <Compass className="w-5 h-5 text-rose-500" />;
    }
  };

  return (
    <div className="w-full">
      {/* Ecosystem Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
        <div className="lg:col-span-7">
          <h3 className="font-display font-medium text-xs text-primary bg-primary/10 tracking-widest uppercase inline-block px-3 py-1 rounded-sm mb-4">
            {content.eco_sec_badge}
          </h3>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text tracking-tight">
            {content.eco_sec_title}
          </h2>
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            {content.eco_sec_desc}
          </p>
        </div>
        
        <div className="lg:col-span-5 flex lg:justify-end">
          <div className="text-xs bg-slate-100 text-gray-500 px-4 py-2 rounded-lg border border-brand-border/40 font-mono flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{content.ui.ecosystem.systemNote}</span>
          </div>
        </div>
      </div>

      {/* Grid List of Apps Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {(content.eco_apps || []).map((app) => {
          const isActive = app.status === 'active';
          const appUrl = app.id === 'todo-matrix' ? TODO_MATRIX_APP_URL : undefined;
          return (
            <div
              key={app.id}
              onClick={() => {
                if (appUrl) {
                  window.location.href = appUrl;
                }
              }}
              className={`p-6 rounded-xl border flex flex-col justify-between h-72 transition-all relative overflow-hidden group ${
                isActive
                  ? 'bg-blue-600 border-blue-700 text-white shadow-lg ring-4 ring-blue-600/10 scale-102 hover:shadow-xl'
                  : 'bg-white border-brand-border hover:border-slate-300 hover:shadow-md hover:translate-y-[-2px]'
              } ${appUrl ? 'cursor-pointer' : ''}`}
            >
              {/* Card visual elements */}
              {isActive && (
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xs pointer-events-none" />
              )}

              <div>
                <div className="flex items-center justify-between pointer-events-none select-none">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-xs ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-50 border border-brand-border/60'
                  }`}>
                    {getSuiteIcon(app.id)}
                  </div>
                  
                  {isActive ? (
                    <span className="text-[9px] px-2 py-0.5 bg-emerald-500 border border-emerald-400 text-white rounded font-bold uppercase tracking-widest">
                      {content.ui.ecosystem.statusActive}
                    </span>
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-400 rounded border border-brand-border/40 font-bold uppercase tracking-widest">
                      {content.ui.ecosystem.statusSoon}
                    </span>
                  )}
                </div>

                <h3 className={`font-display font-bold text-lg mt-5 ${isActive ? 'text-white' : 'text-gray-900 group-hover:text-primary transition-colors'}`}>
                  {app.name}
                </h3>
                
                <p className={`text-xs mt-2 leading-relaxed ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                  {app.desc}
                </p>
              </div>

              {/* Lower trigger status actions */}
              <div className={`pt-4 border-t ${isActive ? 'border-white/25' : 'border-brand-border/40'}`}>
                {isActive ? (
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{content.ui.ecosystem.activeAction}</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-400">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> {content.ui.ecosystem.pendingAction}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Ecosystem Sandbox Banner Ad */}
      <div className="mt-8 p-5 rounded-xl border border-brand-border bg-slate-50 border-dashed text-center max-w-4xl mx-auto flex items-center justify-center flex-col sm:flex-row gap-4">
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[8px] font-bold text-white">T</div>
          <div className="w-6 h-6 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[8px] font-bold text-white">N</div>
          <div className="w-6 h-6 rounded-full bg-amber-500 border border-white flex items-center justify-center text-[8px] font-bold text-white">A</div>
          <div className="w-6 h-6 rounded-full bg-rose-500 border border-white flex items-center justify-center text-[8px] font-bold text-white">F</div>
        </div>
        <div className="text-xs text-gray-500 text-left font-sans">
          <strong>{content.ui.ecosystem.betaTitle}</strong>：{content.ui.ecosystem.betaDescription}
        </div>
      </div>
    </div>
  );
}
