import React from 'react';
import { LayoutGrid, Mail, HelpCircle, ExternalLink, ShieldAlert } from 'lucide-react';

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
}

export default function Footer({ onScrollToSection }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-900 text-white pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10 pb-8 border-b border-slate-800">
          
          {/* Logo Brand Info (4/12 width) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-2.5">
              {/* Logo Grid */}
              <div className="w-7 h-7 rounded bg-slate-800 grid grid-cols-2 gap-0.5 p-1 border border-slate-700 shadow-sm">
                <div className="rounded-[1.5px] bg-rose-500"></div>
                <div className="rounded-[1.5px] bg-emerald-500"></div>
                <div className="rounded-[1.5px] bg-amber-500"></div>
                <div className="rounded-[1.5px] bg-blue-600"></div>
              </div>
              <span className="font-display font-bold text-base text-white tracking-tight">Todo Matrix</span>
            </div>
            
            <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed max-w-sm">
              基于重要紧急十字交叉维度的智能化待办整理面板。看见真正的优先级冲突并排除日常琐碎噪音。
            </p>
            
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <Mail className="w-3.5 h-3.5" />
              <span>weijianghong007@gmail.com</span>
            </div>
          </div>

          {/* Links 1: Navigation (2/12) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider font-display uppercase">核心模块</h4>
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-400">
              <li>
                <button onClick={() => onScrollToSection('hero')} className="hover:text-blue-400 bg-transparent p-0 border-0 outline-none cursor-pointer">
                  智能矩阵首屏
                </button>
              </li>
              <li>
                <button onClick={() => onScrollToSection('values')} className="hover:text-blue-400 bg-transparent p-0 border-0 outline-none cursor-pointer">
                  核心精益价值
                </button>
              </li>
              <li>
                <button onClick={() => onScrollToSection('methodology')} className="hover:text-blue-400 bg-transparent p-0 border-0 outline-none cursor-pointer">
                  十字决策探索
                </button>
              </li>
            </ul>
          </div>

          {/* Links 2: Downloads (2/12) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider font-display uppercase">资源下载</h4>
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-400">
              <li>
                <button onClick={() => onScrollToSection('installer')} className="hover:text-blue-400 bg-transparent p-0 border-0 outline-none cursor-pointer">
                  浏览器 Web / PWA
                </button>
              </li>
              <li>
                <button onClick={() => onScrollToSection('installer')} className="hover:text-blue-400 bg-transparent p-0 border-0 outline-none cursor-pointer">
                  Windows 原生桌面
                </button>
              </li>
              <li>
                <button onClick={() => onScrollToSection('installer')} className="hover:text-blue-400 bg-transparent p-0 border-0 outline-none cursor-pointer">
                  Android 安装程序
                </button>
              </li>
            </ul>
          </div>

          {/* Links 3: Ecosystem (2/12) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider font-display uppercase">生态盒子 Matrix</h4>
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-400">
              <li>
                <span className="text-white font-semibold">Todo Matrix</span>
              </li>
              <li>
                <span className="text-slate-500 truncate block">Note Grid (即将推出)</span>
              </li>
              <li>
                <span className="text-slate-500 truncate block">Time Axis (即将推出)</span>
              </li>
            </ul>
          </div>

          {/* Links 4: Legal / Stats (2/12) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider font-display uppercase">关于与隐私</h4>
            <ul className="space-y-1.5 text-[11px] sm:text-xs text-slate-400">
              <li>
                <span className="text-slate-400">本地离线保护</span>
              </li>
              <li>
                <span className="text-slate-400">数据自由一键导出</span>
              </li>
              <li>
                <span className="text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> 联络反馈
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Lower Row copyright and notice */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-slate-500 space-y-3 sm:space-y-0">
          <div>
            <span>&copy; {currentYear} Todo Matrix Core. 设计服务于专注.</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-slate-600">Privacy Policy</span>
            <span className="text-slate-600">Terms of Service</span>
            <span className="text-slate-600 font-mono">Build 2026.06.16</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
