export interface SubTask {
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  importance: number; // 0 to 100 (horizontal axis)
  urgency: number;    // 0 to 100 (vertical axis)
  progress: number;   // 0 to 100
  color: string;      // RGB hex or Tailwind color class
  status: 'todo' | 'doing' | 'done';
  subtasks: SubTask[];
  category: string;
}

export interface QuadrantInfo {
  id: 'do-first' | 'plan' | 'delegate' | 'eliminate';
  title: string;
  subTitle: string;
  description: string;
  colorClass: string;
  dotColor: string;
  action: string;
  exampleTasks: string[];
}

export interface AppSuiteItem {
  id: string;
  name: string;
  description: string;
  iconName: string;
  status: 'active' | 'coming-soon' | 'beta';
  url?: string;
  color: string;
}

// Initial mockup data strictly modeled from the real application screenshots provided
export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: '尝试科创平台',
    importance: 85,
    urgency: 88,
    progress: 30,
    color: '#1d4ed8', // Primary Blue
    status: 'doing',
    category: '工作创新',
    subtasks: [
      { title: '注册并完善团队资料', completed: true },
      { title: '申请首批科创项目入驻', completed: false },
      { title: '提交项目计划书初稿', completed: false }
    ]
  },
  {
    id: '2',
    title: '继续AI+找论文',
    importance: 72,
    urgency: 74,
    progress: 10,
    color: '#3b82f6', // Bright Blue
    status: 'todo',
    category: '学术研究',
    subtasks: [
      { title: '多关键词检索最新顶会论文', completed: true },
      { title: '筛选前5篇并深度阅读摘要', completed: false }
    ]
  },
  {
    id: '3',
    title: '学习Hermes源码',
    importance: 58,
    urgency: 44,
    progress: 0,
    color: '#10b981', // Green
    status: 'todo',
    category: '技术深造',
    subtasks: []
  },
  {
    id: '4',
    title: '整理并且创建X日报',
    importance: 62,
    urgency: 36,
    progress: 0,
    color: '#d97706', // Yellow / Orange
    status: 'todo',
    category: '日常管理',
    subtasks: [
      { title: '汇总当日团队开发进度', completed: false },
      { title: '确认明天核心排期', completed: false }
    ]
  },
  {
    id: '5',
    title: '尝试龙虾+公司的deepseek',
    importance: 52,
    urgency: 48,
    progress: 0,
    color: '#10b981', // Green
    status: 'todo',
    category: '效率测试',
    subtasks: []
  },
  {
    id: '6',
    title: '调查公积金问题',
    importance: 64,
    urgency: 22,
    progress: 25,
    color: '#ef4444', // Red
    status: 'doing',
    category: '个人事务',
    subtasks: [
      { title: '在线登录公积金管理中心', completed: true },
      { title: '拨打社保局电话核对汇缴数额', completed: false }
    ]
  },
  {
    id: '7',
    title: 'vibe coding todo matrix v3',
    importance: 58,
    urgency: 28,
    progress: 63,
    color: '#2563eb', // Indigo Blue
    status: 'doing',
    category: '项目迭代',
    subtasks: [
      { title: '设计Eisenhower拖拽画布结构', completed: true },
      { title: '实现首屏高饱和度动效与飞入路径', completed: true },
      { title: '适配移动端与手势监听', completed: false }
    ]
  },
  {
    id: '8',
    title: '降低中国移动的套餐',
    importance: 44,
    urgency: 18,
    progress: 100,
    color: '#ec4899', // Pink
    status: 'done',
    category: '财务开支',
    subtasks: [
      { title: '打10086人工客服查询现有合约', completed: true },
      { title: '办理18元保号套餐并确认下月生效', completed: true }
    ]
  },
  {
    id: '9',
    title: '3D code graph的需求。加上执行栈高...',
    importance: 15,
    urgency: 12,
    progress: 0,
    color: '#3b82f6', // Light blue
    status: 'todo',
    category: '未来规划',
    subtasks: []
  },
  {
    id: '10',
    title: 'Vibe Coding保存一切的应用',
    importance: 24,
    urgency: 8,
    progress: 20,
    color: '#3b82f6', // Blue
    status: 'todo',
    category: '想法实验',
    subtasks: []
  }
];

export const QUADRANT_INFOS: QuadrantInfo[] = [
  {
    id: 'do-first',
    title: '重要且紧急',
    subTitle: '立即处理 · Do First',
    description: '具有极高的时间紧迫性和业务价值，不解决会立即产生严重后果的事项。应放在绝对首位执行。',
    colorClass: 'border-l-4 border-l-rose-500 bg-rose-50/20 text-rose-950',
    dotColor: '#ef4444',
    action: '立即执行',
    exampleTasks: ['尝试科创平台', '继续AI+找论文']
  },
  {
    id: 'plan',
    title: '重要不紧急',
    subTitle: '计划推进 · Plan / Schedule',
    description: '对长期目标与个人成长至关重要，但由于没有迫切截止期限，最容易被拖延。需要主动规划日程并稳步推进。',
    colorClass: 'border-l-4 border-l-emerald-500 bg-emerald-50/20 text-emerald-950',
    dotColor: '#10b981',
    action: '计划时间',
    exampleTasks: ['学习Hermes源码', '尝试龙虾+公司的deepseek']
  },
  {
    id: 'delegate',
    title: '紧急不重要',
    subTitle: '减少打断 · Delegate',
    description: '时间上十分紧迫，但本身产生的对核心目标的意义并不大。应尽可能委派、减少打扰，或批量化集中处理。',
    colorClass: 'border-l-4 border-l-amber-500 bg-amber-50/20 text-amber-950',
    dotColor: '#f59e0b',
    action: '学会委派 / 减少打扰',
    exampleTasks: ['整理并且创建X日报']
  },
  {
    id: 'eliminate',
    title: '不重要不紧急',
    subTitle: '延后或放弃 · Eliminate / Avoid',
    description: '属于琐事或甚至消耗精力的杂项。如果时间充沛可放在最后消遣，如若不然，可以无压力地延后或断然放弃。',
    colorClass: 'border-l-4 border-l-slate-400 bg-slate-50/30 text-slate-900',
    dotColor: '#94a3b8',
    action: '延后或放弃',
    exampleTasks: ['3D code graph的需求', '降低中国移动的套餐']
  }
];

export const APP_SUITE: AppSuiteItem[] = [
  {
    id: 'todo-matrix',
    name: 'Todo Matrix',
    description: '象限维度优先级任务管理专家',
    iconName: 'LayoutGrid',
    status: 'active',
    url: '/app/',
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'note-grid',
    name: 'Note Grid',
    description: '多维卡片双链知识块记录引擎',
    iconName: 'StickyNote',
    status: 'coming-soon',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'time-axis',
    name: 'Time Axis',
    description: '线性回顾与甘特排期时间流管理',
    iconName: 'Milestone',
    status: 'coming-soon',
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'focus-dome',
    name: 'Focus Dome',
    description: '声景化番茄钟与全神贯注沉浸自习',
    iconName: 'Compass',
    status: 'coming-soon',
    color: 'from-rose-500 to-red-600'
  }
];
