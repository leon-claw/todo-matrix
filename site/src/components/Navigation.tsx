import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, ChevronDown, Download, ExternalLink, Menu, X, ArrowRight, Layers, FileText, Calendar, Sparkles } from 'lucide-react';
import { APP_SUITE } from '../types';

interface NavigationProps {
  onScrollToSection: (sectionId: string) => void;
  showAppMatrix: boolean;
  setShowAppMatrix: (show: boolean) => void;
}

export default function Navigation({ onScrollToSection, showAppMatrix, setShowAppMatrix }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: '智能矩阵首屏', targetId: 'hero' },
    { label: '核心价值', targetId: 'values' },
    { label: '坐标决策室', targetId: 'methodology' },
    { label: '工作流拆解', targetId: 'workflow' },
    { label: '多端安装', targetId: 'installer' },
    { label: '生态盒子', targetId: 'ecosystem' },
  ];

  const toggleAppMatrix = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAppMatrix(!showAppMatrix);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border/60 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onScrollToSection('hero')} 
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          {/* Authentic Pixel-Perfect Matrix Logo Grid from Screenshot */}
          <div className="relative w-8.5 h-8.5 rounded-lg bg-white grid grid-cols-2 gap-0.5 p-[3px] border border-slate-200 shadow-[0_1.5px_4px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-all duration-300">
            {/* Top Left: Light Blue */}
            <div className="rounded-[3px] bg-[#60a5fa] transition-all duration-300 opacity-90 group-hover:opacity-100"></div>
            {/* Top Right: Emerald Green */}
            <div className="rounded-[3px] bg-[#10b981] transition-all duration-300 opacity-90 group-hover:opacity-100"></div>
            {/* Bottom Left: Vibrant Blue with Mini Checkmark */}
            <div className="rounded-[3px] bg-[#2563eb] flex items-center justify-center transition-all duration-300 opacity-95 group-hover:opacity-100 relative">
              <svg 
                className="w-2.5 h-2.5 text-white stroke-[3.5] drop-shadow-sm" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            {/* Bottom Right: Coral Red */}
            <div className="rounded-[3px] bg-[#ef4444] transition-all duration-300 opacity-90 group-hover:opacity-100"></div>
          </div>

          <div className="flex flex-col">
            <span className="font-display font-black text-[17px] text-brand-text tracking-tight flex items-center gap-1 leading-none">
              Todo Matrix
              <span className="text-[9px] px-1.5 py-0.5 bg-[#eff6ff] border border-blue-100 text-[#2563eb] font-mono rounded-md font-bold">V3.0</span>
            </span>
          </div>
        </div>

        {/* Desktop Navigation Inputs */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.targetId}
              onClick={() => onScrollToSection(item.targetId)}
              className="px-3.5 py-1.5 text-sm font-medium text-gray-600 hover:text-primary hover:bg-slate-50 rounded-md transition-all duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {/* App Switcher Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={toggleAppMatrix}
              className={`flex items-center space-x-1 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                showAppMatrix 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-slate-100 text-gray-700 hover:bg-slate-200 border border-brand-border/40'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>应用矩阵</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAppMatrix ? 'rotate-180' : ''}`} />
            </button>

            {/* App Suite Dynamic Dropdown Menu */}
            <AnimatePresence>
              {showAppMatrix && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-brand-border/80 overflow-hidden z-50 text-left"
                >
                  <div className="p-4 bg-slate-50 border-b border-brand-border/50">
                    <h3 className="font-display font-bold text-sm text-brand-text flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-primary" /> Matrix Workspace Suite
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">跨越维度的效率工具拼图，支持统一账号无缝跳转</p>
                  </div>
                  <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                    {APP_SUITE.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => {
                          if (app.url) {
                            window.location.href = app.url;
                          }
                        }}
                        className={`p-2 rounded-lg flex items-start space-x-3 transition-colors ${
                          app.status === 'active' 
                            ? 'bg-blue-50/50 border border-blue-100' 
                            : 'hover:bg-slate-50/80 border border-transparent'
                        } ${app.url ? 'cursor-pointer' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${app.color} flex items-center justify-center text-white shrink-0`}>
                          <LayoutGrid className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-900">{app.name}</span>
                            {app.status === 'active' ? (
                              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500 text-white rounded font-bold uppercase tracking-tight scale-90">LIVE</span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 text-slate-500 rounded font-bold scale-90">SOON</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{app.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 px-3 bg-slate-50/80 border-t border-brand-border/40 text-center text-[11px] text-gray-400 font-mono">
                    更多拼图即将点亮 ...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => onScrollToSection('installer')}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-dark transition-all duration-200 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>获取客户端</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center space-x-2">
          {/* Quick Trigger App Matrix for Mobile too */}
          <button
            onClick={() => setShowAppMatrix(!showAppMatrix)}
            className="p-2 bg-slate-100 text-gray-600 rounded-lg hover:bg-slate-200 transition"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-primary transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-brand-border/60 bg-white"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.targetId}
                  onClick={() => {
                    onScrollToSection(item.targetId);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-slate-50 transition"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-brand-border/40 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onScrollToSection('installer');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-md text-base font-medium bg-primary text-white"
                >
                  <Download className="w-4 h-4" />
                  <span>获取客户端</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Interactive Overlay Grid Switcher panel */}
      <AnimatePresence>
        {showAppMatrix && (
          <div className="md:hidden fixed top-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md shadow-lg border-b border-brand-border/80 z-40 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-brand-border/50">
              <span className="font-display font-bold text-sm text-brand-text flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Matrix Workspace Suite
              </span>
              <button onClick={() => setShowAppMatrix(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-1 space-y-2 mt-3">
              {APP_SUITE.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    if (app.url) {
                      window.location.href = app.url;
                    }
                  }}
                  className={`p-3 rounded-md flex items-center justify-between border ${
                    app.status === 'active' 
                      ? 'bg-blue-50/50 border-blue-100' 
                      : 'border-slate-100 hover:bg-slate-50'
                  } ${app.url ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${app.color} flex items-center justify-center text-white shrink-0`}>
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block">{app.name}</span>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{app.description}</p>
                    </div>
                  </div>
                  {app.status === 'active' ? (
                    <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500 text-white rounded font-bold">LIVE</span>
                  ) : (
                    <span className="text-[8px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded font-bold">SOON</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
