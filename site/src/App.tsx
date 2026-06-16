import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Sparkles, Download, Layers, ShieldCheck, 
  HelpCircle, Monitor, Smartphone, Globe, Plus, Play, Info, Eye, CheckCircle2
} from 'lucide-react';

// Import our modular custom sections
import Navigation from './components/Navigation';
import CoolCarousel from './components/CoolCarousel';
import QuadrantExplorer from './components/QuadrantExplorer';
import WorkflowSection from './components/WorkflowSection';
import Installer from './components/Installer';
import AppEcosystem from './components/AppEcosystem';
import TrustSection from './components/TrustSection';
import Footer from './components/Footer';

import { TODO_MATRIX_APP_URL } from './config/urls';
import { content } from './utils/mdxParser';

export default function App() {
  // Global switcher dropdown status tracking
  const [showAppMatrix, setShowAppMatrix] = useState(false);

  // Smooth click scroll to section handler
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  // Close dropdown on clicking body background
  const handleOverlayClose = () => {
    if (showAppMatrix) setShowAppMatrix(false);
  };

  return (
    <div 
      onClick={handleOverlayClose}
      className="min-h-screen bg-[#f6f8fb] text-[#111827] font-sans antialiased selection:bg-primary/10 selection:text-primary transition-colors duration-300"
    >
      {/* Top Header Navigation */}
      <Navigation 
        onScrollToSection={handleScrollToSection}
        showAppMatrix={showAppMatrix}
        setShowAppMatrix={setShowAppMatrix}
      />

      {/* Hero首屏 Section - Featuring the 3D iOS Music-App Style Preview Carousel */}
      <section id="hero" className="pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden relative border-b border-brand-border/60">
        
        {/* Abstract grids accent background */}
        <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
          <div className="absolute top-0 left-1/4 w-full h-full matrix-grid bg-repeat opacity-40"></div>
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-3xl"></div>
          <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-emerald-50/40 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Main Hero Hook Title with display typography */}
          <div className="max-w-4xl mx-auto space-y-4 mb-4 text-center">
            
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider font-mono uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>新人类待办维度方案 · Todo Matrix V3.0</span>
            </div>

            <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-[54px] text-gray-900 tracking-tight leading-none">
              {content.hero_title_left}
              <span className="text-primary relative inline-block mx-2 font-black">
                {content.hero_title_accent}
                <span className="absolute left-0 bottom-1 w-full h-[6px] bg-primary/20 rounded-full"></span>
              </span>
              {content.hero_title_right}
            </h1>
            
            <p className="text-sm sm:text-base md:text-md text-gray-500 max-w-2xl mx-auto leading-relaxed pt-2">
              {content.hero_subtitle}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-3">
              <button 
                onClick={() => {
                  window.location.href = TODO_MATRIX_APP_URL;
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold bg-[#111827] text-white hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                <span>{content.hero_cta_primary}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button 
                onClick={() => handleScrollToSection('installer')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold bg-white border border-brand-border text-gray-700 hover:bg-slate-50 hover:text-primary transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4 text-gray-500" />
                <span>{content.hero_cta_secondary}</span>
              </button>
            </div>
          </div>

          {/* iOS-Style 3D Album Cover Flow Carousel showcasing app screenshots */}
          <div className="max-w-5xl mx-auto mt-4 overflow-visible">
            <CoolCarousel />
          </div>

        </div>
      </section>

      {/* Core values Section (核心价值区) */}
      <section id="values" className="py-16 md:py-20 border-b border-brand-border/60 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="font-display font-medium text-xs text-primary bg-primary/10 tracking-widest uppercase inline-block px-3 py-1 rounded-sm mb-4">
              {content.value_sec_badge}
            </h3>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text tracking-tight animate-fade-in">
              {content.value_sec_title}
            </h2>
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
              {content.value_sec_desc}
            </p>
          </div>

          {/* 4x1 Grid of core features details in container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(content.values_list || []).map((v) => (
              <div key={v.id} className="bg-slate-50 border border-brand-border p-6 rounded-xl space-y-4 shadow-xs hover:shadow-md transition-all duration-300">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold ${
                  v.id === '01' ? 'bg-blue-50 border border-blue-100 text-primary' :
                  v.id === '02' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' :
                  v.id === '03' ? 'bg-indigo-50 border border-indigo-100 text-indigo-600' :
                  'bg-amber-50 border border-amber-100 text-amber-600'
                }`}>
                  {v.id}
                </div>
                <h3 className="font-display font-bold text-lg text-brand-text">{v.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Frictionless cloud synchronization inline statement */}
          <div className="mt-12 p-3 text-center text-xs text-gray-400 font-mono flex items-center justify-center gap-1.5 flex-col sm:flex-row">
            <span className="font-bold text-primary mr-1 flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-sm">PWA</span>
            <span>本地即开即用 · 登录后账户无缝打通跨终端云同步。</span>
          </div>

        </div>
      </section>

      {/* Methodology Section (交叉象限探究区) */}
      <section id="methodology" className="py-16 md:py-20 border-b border-brand-border/60 bg-[#fbfcfd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuadrantExplorer />
        </div>
      </section>

      {/* Flow Steps Timeline Section (工作流程图) */}
      <section id="workflow" className="py-16 md:py-20 border-b border-brand-border/60 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WorkflowSection />
        </div>
      </section>

      {/* Multiple platform downloads & client install Section (多端与下载区) */}
      <section id="installer" className="py-16 md:py-20 border-b border-brand-border/60 bg-[#fcfdfe]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Installer />
        </div>
      </section>

      {/* Multi Workspace Suites Ecosystem Area (应用生态区) */}
      <section id="ecosystem" className="py-16 md:py-20 border-b border-brand-border/60 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AppEcosystem />
        </div>
      </section>

      {/* Trust & Local State System Area (数据安全可靠区) */}
      <section id="trust" className="py-16 md:py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TrustSection />
        </div>
      </section>

      {/* Full-size Professional Minimal Footer */}
      <Footer onScrollToSection={handleScrollToSection} />
    </div>
  );
}
