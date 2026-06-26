import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Inbox, Sliders, LayoutGrid, CheckSquare, BarChart, Flag, ChevronRight } from 'lucide-react';
import { useSiteContent } from '../i18n/content';

interface Step {
  num: string;
  title: string;
  desc: string;
  subText: string;
  icon: React.ReactNode;
  color: string;
}

export default function WorkflowSection() {
  const content = useSiteContent();
  const [activeStep, setActiveStep] = useState<number>(0);

  const icons = [
    <Inbox className="w-5 h-5" />,
    <Sliders className="w-5 h-5" />,
    <LayoutGrid className="w-5 h-5" />,
    <CheckSquare className="w-5 h-5" />,
    <BarChart className="w-5 h-5" />,
    <Flag className="w-5 h-5" />
  ];

  const colors = [
    'bg-blue-600 text-white border-blue-600',
    'bg-emerald-600 text-white border-emerald-600',
    'bg-indigo-600 text-white border-indigo-600',
    'bg-amber-600 text-white border-amber-600',
    'bg-rose-600 text-white border-rose-600',
    'bg-slate-700 text-white border-slate-700'
  ];

  const steps: Step[] = (content.workflow_steps || []).map((s, idx) => ({
    num: s.step || `0${idx + 1}`,
    title: s.title || '',
    desc: s.desc || '',
    subText: s.subText || '',
    icon: icons[idx] || <CheckSquare className="w-5 h-5" />,
    color: colors[idx] || 'bg-slate-700 text-white border-slate-700'
  }));

  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h3 className="font-display font-medium text-xs text-primary bg-primary/10 tracking-widest uppercase inline-block px-3 py-1 rounded-sm mb-4">
          {content.workflow_sec_badge}
        </h3>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text tracking-tight animate-fade-in">
          {content.workflow_sec_title}
        </h2>
        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
          {content.workflow_sec_desc}
        </p>
      </div>

      {/* Horizontal Steps Pipeline for Desktops */}
      <div className="hidden lg:block max-w-6xl mx-auto mb-8">
        <div className="flex items-start justify-between relative pl-4 pr-4">
          
          {/* Background Connecting Running Line */}
          <div className="absolute top-10 left-12 right-12 h-1 bg-brand-border/60 -z-10">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Stepper Card Nodes */}
          {steps.map((step, idx) => {
            const isCompleted = idx <= activeStep;
            const isCurrent = idx === activeStep;
            return (
              <div 
                key={idx} 
                className="flex flex-col items-center flex-1 cursor-pointer group px-2"
                onClick={() => setActiveStep(idx)}
                style={{ outline: 'none' }}
              >
                {/* Visual Circle Bubble */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-md ${
                    isCurrent 
                      ? `${step.color} scale-110 ring-4 ring-primary/10` 
                      : isCompleted 
                        ? 'bg-blue-50 text-primary border-primary' 
                        : 'bg-white text-gray-400 border-brand-border hover:border-gray-300'
                  }`}
                >
                  {step.icon}
                </div>

                <span className="text-[10px] font-mono font-bold text-gray-400 mt-4 tracking-wider">
                  {content.ui.workflow.stepLabel} {step.num}
                </span>
                <span className="text-xs font-bold text-brand-text mt-1.5 text-center group-hover:text-primary transition-colors block">
                  {step.title}
                </span>
                <span className="text-[11px] text-gray-500 text-center mt-1 block">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stepper Main Description Card Block */}
      <div className="max-w-4xl mx-auto bg-white border border-brand-border rounded-xl p-6 sm:p-8 shadow-xs mb-10 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Big Colorful Number Circle Accent */}
          <div className="md:col-span-3 flex justify-center md:border-r border-brand-border/60 md:pr-6">
            <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center ${steps[activeStep].color} shadow-lg relative`}>
              <span className="text-[11px] font-mono font-bold tracking-wider opacity-85 uppercase">
                {content.ui.workflow.stageLabel}
              </span>
              <span className="text-4xl font-display font-extrabold -mt-1">{steps[activeStep].num}</span>
            </div>
          </div>

          <div className="md:col-span-9 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase font-mono tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                {content.ui.workflow.activeLabel}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">{steps[activeStep].desc}</span>
            </div>
            
            <h3 className="font-display font-bold text-[#111827] text-xl sm:text-2xl">
              {steps[activeStep].title}
            </h3>
            
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              {steps[activeStep].subText}
            </p>
          </div>
        </div>
      </div>

      {/* Vertical Interactive Timeline for Mobile / Small Screens */}
      <div className="lg:hidden max-w-xl mx-auto space-y-4">
        {steps.map((step, idx) => {
          const isCurrent = idx === activeStep;
          return (
            <div
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isCurrent 
                  ? 'bg-blue-50/40 border-primary shadow-xs ring-1 ring-primary/20' 
                  : 'bg-white border-brand-border/80'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                  isCurrent ? `${step.color} shadow-xs` : 'bg-slate-50 text-slate-400 border-brand-border'
                }`}>
                  {step.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{step.title}</span>
                    <span className="text-[10px] font-mono text-gray-400 font-bold">
                      {content.ui.workflow.stepLabel} {step.num}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">{step.desc}</p>
                  
                  {isCurrent && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-brand-border/40 leading-relaxed"
                    >
                      {step.subText}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
