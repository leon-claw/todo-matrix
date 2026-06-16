import React from 'react';
import { ShieldCheck, Database, WifiOff, FileDown, Lock, ShieldAlert } from 'lucide-react';
import { content } from '../utils/mdxParser';

export default function TrustSection() {
  const icons = [
    <Lock className="w-5 h-5 text-gray-700" />,
    <Database className="w-5 h-5 text-gray-700" />,
    <WifiOff className="w-5 h-5 text-gray-700" />,
    <FileDown className="w-5 h-5 text-gray-700" />
  ];

  return (
    <div className="w-full">
      <div className="bg-slate-50 border border-brand-border rounded-xl p-6 sm:p-10 shadow-xs">
        
        {/* Title Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-8 pb-8 border-b border-brand-border/60">
          <div className="lg:col-span-8 space-y-2">
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">
              {content.trust_sec_badge}
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              {content.trust_sec_title}
            </h2>
          </div>
          
          <div className="lg:col-span-4 lg:text-right">
            <p className="text-xs text-gray-400 sm:max-w-xs lg:ml-auto">
              {content.trust_sec_desc}
            </p>
          </div>
        </div>

        {/* 4 Cards Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(content.trust_list || []).map((v, idx) => (
            <div key={idx} className="space-y-3.5">
              <div className="w-9 h-9 rounded-lg bg-white border border-brand-border flex items-center justify-center shadow-xs">
                {icons[idx] || <Lock className="w-5 h-5 text-gray-700" />}
              </div>
              
              <h3 className="text-xs sm:text-sm font-bold text-[#111827]">
                {v.title}
              </h3>
              
              <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                {v.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
