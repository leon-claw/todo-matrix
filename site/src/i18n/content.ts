import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { content as zhContent, type ContentData } from '../utils/mdxParser';
import { DEFAULT_LANGUAGE, type SiteLanguage, normalizeLanguage } from './locale';

interface NavItem {
  label: string;
  targetId: string;
}

interface CarouselSlide {
  badge: string;
  title: string;
  subtitle: string;
}

interface SiteUiContent {
  heroBadge: string;
  pwaNote: string;
  nav: {
    appSwitcherLabel: string;
    closeMenu: string;
    getClient: string;
    items: NavItem[];
    live: string;
    moreSoon: string;
    soon: string;
    suiteDescription: string;
    suiteTitle: string;
  };
  carousel: {
    dotLabel: string;
    next: string;
    previous: string;
    slides: CarouselSlide[];
  };
  quadrant: {
    actionLabel: string;
    examplesLabel: string;
    goToAxis: string;
    labels: Record<string, string>;
  };
  workflow: {
    activeLabel: string;
    stageLabel: string;
    stepLabel: string;
  };
  installer: {
    points: Array<{ title: string; desc: string }>;
  };
  ecosystem: {
    activeAction: string;
    betaDescription: string;
    betaTitle: string;
    pendingAction: string;
    statusActive: string;
    statusSoon: string;
    systemNote: string;
  };
  footer: {
    brandDescription: string;
    columns: Array<{ title: string; links: string[] }>;
    contact: string;
    copyright: string;
    privacy: string;
    terms: string;
  };
  language: {
    label: string;
    chinese: string;
    english: string;
  };
}

export interface SiteContent extends ContentData {
  ui: SiteUiContent;
}

const zhSiteContent: SiteContent = {
  ...zhContent,
  ui: {
    heroBadge: '新人类待办维度方案 · Todo Matrix',
    pwaNote: '本地即开即用 · 登录后账户无缝打通跨终端云同步。',
    nav: {
      appSwitcherLabel: '应用矩阵',
      closeMenu: '关闭菜单',
      getClient: '获取客户端',
      items: [
        { label: '智能矩阵首屏', targetId: 'hero' },
        { label: '核心价值', targetId: 'values' },
        { label: '坐标决策室', targetId: 'methodology' },
        { label: '工作流拆解', targetId: 'workflow' },
        { label: '多端安装', targetId: 'installer' },
        { label: '生态盒子', targetId: 'ecosystem' },
      ],
      live: 'LIVE',
      moreSoon: '更多拼图即将点亮 ...',
      soon: 'SOON',
      suiteDescription: '跨越维度的效率工具拼图，支持统一账号无缝跳转',
      suiteTitle: 'Matrix Workspace Suite',
    },
    carousel: {
      previous: '上一张',
      next: '下一张',
      dotLabel: '查看第 {{index}} 张',
      slides: [
        {
          badge: '桌面矩阵 · DESKTOP',
          title: '在大屏上看清任务位置',
          subtitle: '重要度与紧急度组成坐标轴，任务落在矩阵里的哪个位置，优先级就一眼清楚。',
        },
        {
          badge: '移动端矩阵 · MOBILE',
          title: '手机上也能整理优先级',
          subtitle: '随时查看任务、切换筛选、隐藏坐标轴，在碎片时间里也能把事情重新排好。',
        },
        {
          badge: '重要度 × 紧急度',
          title: '调整两个数值，任务重新排序',
          subtitle: '在编辑页修改重要度、紧急度、进度和子待办，保存后任务会回到新的矩阵位置。',
        },
      ],
    },
    quadrant: {
      actionLabel: '行动指引',
      examplesLabel: '典型任务映射',
      goToAxis: '前往坐标',
      labels: {
        'do-first': 'QUADRANT I · Do First',
        plan: 'QUADRANT II · Plan',
        delegate: 'QUADRANT III · Delegate',
        eliminate: 'QUADRANT IV · Eliminate',
      },
    },
    workflow: {
      activeLabel: '工作流操作环节',
      stageLabel: 'STAGE',
      stepLabel: 'STEP',
    },
    installer: {
      points: [
        {
          title: '安全无感，离线高可用',
          desc: '断网或差网环境，依旧可以本地整理任务；恢复网络后再继续处理云端同步。',
        },
        {
          title: '轻量不臃肿',
          desc: '以 Web/PWA 为核心，也提供桌面和移动客户端形态，保留简单直接的使用体验。',
        },
      ],
    },
    ecosystem: {
      activeAction: '即刻开始探索',
      betaDescription: '当前优先开放 Todo Matrix。后续工具会围绕任务、知识和时间继续扩展。',
      betaTitle: '内测申请中',
      pendingAction: '正在进行第一阶段编译',
      statusActive: 'Live',
      statusSoon: 'Coming Soon',
      systemNote: '账户体系打通 · 统一跨系统热跳转',
    },
    footer: {
      brandDescription: '基于重要紧急十字交叉维度的待办整理面板。看见真正的优先级冲突，减少日常琐事噪音。',
      columns: [
        { title: '核心模块', links: ['智能矩阵首屏', '核心精益价值', '十字决策探索'] },
        { title: '资源下载', links: ['浏览器 Web / PWA', 'Windows 原生桌面', 'Android 安装程序'] },
        { title: '生态盒子 Matrix', links: ['Todo Matrix', 'Note Grid (即将推出)', 'Time Axis (即将推出)'] },
        { title: '关于与隐私', links: ['本地离线保护', '数据自由一键导出', '联络反馈'] },
      ],
      contact: '联络反馈',
      copyright: '设计服务于专注.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    language: { label: '语言', chinese: '中', english: 'En' },
  },
};

const enSiteContent: SiteContent = {
  title: 'Todo Matrix',
  hero_title_left: 'Organize tasks with the',
  hero_title_accent: 'Eisenhower Matrix',
  hero_title_right: '',
  hero_subtitle:
    'Todo Matrix places every task on an importance x urgency grid. Adjust the two values to reorder priorities and see what deserves attention now.',
  hero_cta_primary: 'Open the matrix',
  hero_cta_secondary: 'View downloads',

  value_sec_badge: 'Method-driven · Eisenhower Matrix',
  value_sec_title: 'A todo list should show priority, not just volume',
  value_sec_desc:
    'The Eisenhower method asks two questions: is it important, and is it urgent? Todo Matrix turns that judgment into a draggable priority grid.',
  values_list: [
    {
      id: '01',
      title: 'Rank by importance and urgency',
      desc: 'Every task has two clear dimensions. Change the values and the task moves to a new place in the matrix.',
    },
    {
      id: '02',
      title: 'Drag tasks when reality changes',
      desc: 'Priorities shift. Move a task point directly to reassess its importance and urgency without rebuilding a long list.',
    },
    {
      id: '03',
      title: 'Four quadrants, four actions',
      desc: 'Do important and urgent work first, schedule important non-urgent work, reduce interruptions, and let low-value tasks wait.',
    },
    {
      id: '04',
      title: 'Move from judgment to execution',
      desc: 'Break tasks into subtasks, track progress, and archive completed work after the matrix clarifies what matters.',
    },
  ],

  method_sec_badge: 'Four Quadrants',
  method_sec_title: 'Adjust the coordinates and priority becomes visible',
  method_sec_desc:
    'Instead of endlessly reordering a list, Todo Matrix organizes work by importance and urgency so both urgent issues and long-term goals stay visible.',
  quad_list: [
    {
      id: 'do-first',
      title: 'Important and urgent',
      action: 'Do First',
      desc: 'These tasks affect outcomes and have time pressure. Raise both dimensions so they appear in the highest-attention area.',
      examples: ['Today’s delivery', 'Urgent blocking issue'],
    },
    {
      id: 'plan',
      title: 'Important, not urgent',
      action: 'Schedule',
      desc: 'These tasks support long-term goals but rarely shout for attention. Keep importance high and plan time for them.',
      examples: ['Long-term project', 'Learning and skill building'],
    },
    {
      id: 'delegate',
      title: 'Urgent, not important',
      action: 'Reduce / Delegate',
      desc: 'These tasks feel pressing but often do not deserve deep focus. Lower importance to reveal them as interruptions.',
      examples: ['Ad hoc messages', 'Repeated follow-ups'],
    },
    {
      id: 'eliminate',
      title: 'Not important, not urgent',
      action: 'Eliminate',
      desc: 'These tasks can be delayed, archived, or removed. Put them in the low-priority area and free your attention.',
      examples: ['Low-value ideas', 'Experiments for later'],
    },
  ],

  workflow_sec_badge: 'From Method To Action',
  workflow_sec_title: 'Decide position first, then decide action',
  workflow_sec_desc:
    'Capture tasks, adjust importance and urgency, let the matrix reorder priorities, then break down and execute the next step.',
  workflow_steps: [
    {
      step: '01',
      title: 'Capture tasks',
      desc: 'Put work into the system',
      subText: 'Collect ideas, commitments, and loose tasks before deciding priority.',
    },
    {
      step: '02',
      title: 'Set importance',
      desc: 'Judge impact on goals',
      subText: 'Importance reflects outcome, long-term value, and whether the task moves a real goal forward.',
    },
    {
      step: '03',
      title: 'Set urgency',
      desc: 'Judge time pressure',
      subText: 'Urgency reflects deadlines, external pressure, and immediate consequences.',
    },
    {
      step: '04',
      title: 'Let the matrix reorder',
      desc: 'Make priority visible',
      subText: 'When the two values change, tasks move on the grid and the priority relationship becomes easier to read.',
    },
    {
      step: '05',
      title: 'Break down action',
      desc: 'Turn priority into steps',
      subText: 'Add subtasks to high-priority work so the next action is concrete.',
    },
    {
      step: '06',
      title: 'Track and clean up',
      desc: 'Keep the matrix current',
      subText: 'Use progress, completion, and cleanup to keep the matrix aligned with real priorities.',
    },
  ],

  installer_sec_badge: 'Cross Platform',
  installer_sec_title: 'Use the same priority matrix across devices',
  installer_sec_desc:
    'Priority decisions do not only happen at a desk. Todo Matrix supports Web/PWA, Windows, and Android workflows.',
  platforms_list: [
    {
      name: 'Web / PWA',
      badge: 'Recommended · Instant start',
      desc: 'Open the matrix in a browser or install it as a PWA. Best for quick capture and cross-device access.',
      action: 'Open Web app',
    },
    {
      name: 'Windows desktop',
      badge: 'Desktop · Separate window',
      desc: 'Use the larger screen to review the matrix, task cards, and progress with less friction.',
      action: 'Download Windows app',
    },
    {
      name: 'Android client',
      badge: 'Mobile · Always nearby',
      desc: 'Check tasks, adjust importance and urgency, and update progress from your phone.',
      action: 'Download Android app',
    },
    {
      name: 'More platforms',
      badge: 'Planned',
      desc: 'More client forms can be added around real usage scenarios.',
      action: 'Coming Soon',
    },
  ],

  eco_sec_badge: 'App Suite',
  eco_sec_title: 'Start with the task matrix, then expand the toolbox',
  eco_sec_desc:
    'Todo Matrix focuses on task priority today. Future tools can connect notes, timelines, focus sessions, and more from the same entry.',
  eco_apps: [
    { id: 'todo-matrix', name: 'Todo Matrix', desc: 'Task priority tool based on the Eisenhower Matrix', status: 'active' },
    { id: 'note-grid', name: 'Note Grid', desc: 'Card-based notes for structured thinking', status: 'coming-soon' },
    { id: 'time-axis', name: 'Time Axis', desc: 'Planning, review, and timeline management', status: 'coming-soon' },
    { id: 'focus-dome', name: 'Focus Dome', desc: 'Focus sessions and immersive work blocks', status: 'coming-soon' },
  ],

  trust_sec_badge: 'Data And Reliability',
  trust_sec_title: 'Keep your priority system usable over time',
  trust_sec_desc:
    'A priority system only matters if it stays available. Todo Matrix supports local use, cloud sync, offline continuity, and backups.',
  trust_list: [
    {
      title: 'Start without an account',
      desc: 'Create a local task matrix immediately. Data stays on the current device until you decide to sync.',
    },
    {
      title: 'Sync after sign-in',
      desc: 'When you need multiple devices, sign in and keep cloud tasks isolated by account.',
    },
    {
      title: 'Keep working offline',
      desc: 'Unstable network should not stop priority review. Continue locally and sync again when the connection returns.',
    },
    {
      title: 'Import and export',
      desc: 'Export tasks as JSON backups and restore from backup files when needed.',
    },
  ],

  ui: {
    heroBadge: 'Dimensional todo system · Todo Matrix',
    pwaNote: 'Open locally in seconds · Sign in to sync across devices.',
    nav: {
      appSwitcherLabel: 'App matrix',
      closeMenu: 'Close menu',
      getClient: 'Get clients',
      items: [
        { label: 'Hero', targetId: 'hero' },
        { label: 'Value', targetId: 'values' },
        { label: 'Method', targetId: 'methodology' },
        { label: 'Workflow', targetId: 'workflow' },
        { label: 'Downloads', targetId: 'installer' },
        { label: 'Suite', targetId: 'ecosystem' },
      ],
      live: 'LIVE',
      moreSoon: 'More pieces are coming ...',
      soon: 'SOON',
      suiteDescription: 'A cross-dimensional productivity suite with shared account navigation.',
      suiteTitle: 'Matrix Workspace Suite',
    },
    carousel: {
      previous: 'Previous slide',
      next: 'Next slide',
      dotLabel: 'View slide {{index}}',
      slides: [
        {
          badge: 'Desktop matrix',
          title: 'See task position on a larger canvas',
          subtitle: 'Importance and urgency form the grid, so each task’s priority is easy to read.',
        },
        {
          badge: 'Mobile matrix',
          title: 'Reorder priorities on your phone',
          subtitle: 'Review tasks, switch filters, and hide the matrix when you need a compact mobile view.',
        },
        {
          badge: 'Importance x urgency',
          title: 'Change two values and tasks reorder',
          subtitle: 'Edit importance, urgency, progress, and subtasks; the task returns to its new matrix position.',
        },
      ],
    },
    quadrant: {
      actionLabel: 'Action',
      examplesLabel: 'Example task mapping',
      goToAxis: 'Go to axis',
      labels: {
        'do-first': 'QUADRANT I · Do First',
        plan: 'QUADRANT II · Plan',
        delegate: 'QUADRANT III · Delegate',
        eliminate: 'QUADRANT IV · Eliminate',
      },
    },
    workflow: {
      activeLabel: 'Workflow stage',
      stageLabel: 'STAGE',
      stepLabel: 'STEP',
    },
    installer: {
      points: [
        {
          title: 'Offline-friendly by design',
          desc: 'Keep organizing locally when the network is unstable, then resume cloud sync later.',
        },
        {
          title: 'Lightweight and focused',
          desc: 'A Web/PWA core with desktop and mobile clients keeps the experience simple.',
        },
      ],
    },
    ecosystem: {
      activeAction: 'Start exploring',
      betaDescription: 'Todo Matrix is open first. Future tools will expand around tasks, knowledge, and time.',
      betaTitle: 'Early access',
      pendingAction: 'Preparing the first phase',
      statusActive: 'Live',
      statusSoon: 'Coming Soon',
      systemNote: 'Shared account system · unified cross-app navigation',
    },
    footer: {
      brandDescription:
        'A task board based on the importance and urgency matrix. See priority conflicts and reduce everyday noise.',
      columns: [
        { title: 'Core Modules', links: ['Matrix hero', 'Core value', 'Quadrant method'] },
        { title: 'Downloads', links: ['Browser Web / PWA', 'Windows desktop', 'Android installer'] },
        { title: 'Matrix Suite', links: ['Todo Matrix', 'Note Grid (coming soon)', 'Time Axis (coming soon)'] },
        { title: 'Privacy', links: ['Local offline protection', 'One-click data export', 'Contact'] },
      ],
      contact: 'Contact',
      copyright: 'Designed for focus.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    language: { label: 'Language', chinese: '中', english: 'En' },
  },
};

const siteContentByLanguage: Record<SiteLanguage, SiteContent> = {
  'zh-CN': zhSiteContent,
  'en-US': enSiteContent,
};

export function getSiteContent(language: string | null | undefined = DEFAULT_LANGUAGE) {
  return siteContentByLanguage[normalizeLanguage(language) ?? DEFAULT_LANGUAGE];
}

export function useSiteContent() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  return useMemo(() => getSiteContent(language), [language]);
}
