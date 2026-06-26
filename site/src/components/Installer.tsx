import React from 'react';
import { Monitor, Smartphone, Globe, CloudLightning, ShieldCheck, ArrowRight, AppWindow } from 'lucide-react';
import { TODO_MATRIX_APP_URL, TODO_MATRIX_RELEASES_URL } from '../config/urls';
import { useSiteContent } from '../i18n/content';

interface Platform {
  name: string;
  badge: string;
  description: string;
  actionText: string;
  icon: React.ReactNode;
  status: 'available' | 'soon';
  link?: string;
}

export default function Installer() {
  const content = useSiteContent();
  const icons = [
    <Globe className="w-5 h-5 text-blue-600" />,
    <Monitor className="w-5 h-5 text-emerald-600" />,
    <Smartphone className="w-5 h-5 text-amber-600" />,
    <AppWindow className="w-5 h-5 text-slate-400" />
  ];

  const platformLinks = [TODO_MATRIX_APP_URL, TODO_MATRIX_RELEASES_URL, TODO_MATRIX_RELEASES_URL, undefined];

  const platforms: Platform[] = (content.platforms_list || []).map((p, idx) => ({
    name: p.name || '',
    badge: p.badge || '',
    description: p.desc || '',
    actionText: p.action || '',
    icon: icons[idx] || <Globe className="w-5 h-5 text-blue-600" />,
    status: (p.action === 'Coming Soon') ? 'soon' : 'available',
    link: platformLinks[idx]
  }));

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left column: Value Proposition Content */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-sm text-xs font-bold font-mono">
            <CloudLightning className="w-3.5 h-3.5" />
            <span>{content.installer_sec_badge}</span>
          </div>
          
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
            {content.installer_sec_title}
          </h2>
          
          <p className="text-sm leading-relaxed text-gray-500">
            {content.installer_sec_desc}
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-gray-800 block">{content.ui.installer.points[0]?.title}</span>
                <p className="text-[11px] text-gray-500 leading-normal">{content.ui.installer.points[0]?.desc}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-gray-800 block">{content.ui.installer.points[1]?.title}</span>
                <p className="text-[11px] text-gray-500 leading-normal">{content.ui.installer.points[1]?.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: 2x2 Platform cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {platforms.map((p, idx) => {
            const isAvail = p.status === 'available';
            return (
              <div 
                key={idx}
                className={`p-5 rounded-xl border bg-white flex flex-col justify-between h-56 transition-all duration-300 ${
                  isAvail 
                    ? 'border-brand-border hover:border-slate-300 hover:shadow-md hover:translate-y-[-2px]' 
                    : 'border-slate-100 opacity-60 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{p.badge}</span>
                    <div className="p-1.5 bg-slate-50 border border-brand-border/40 rounded-lg">
                      {p.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xs sm:text-sm font-bold text-[#111827] mt-3.5">{p.name}</h3>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed line-clamp-3">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-brand-border/40">
                  {isAvail ? (
                    <a 
                      href={p.link}
                      target={p.link?.startsWith('http') ? '_blank' : undefined}
                      rel={p.link?.startsWith('http') ? 'noreferrer' : undefined}
                      className="inline-flex items-center text-xs font-bold text-primary hover:text-blue-700 space-x-1"
                    >
                      <span>{p.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </a>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400 uppercase font-mono tracking-wider">{p.actionText}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
