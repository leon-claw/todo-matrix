import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, RotateCcw, Sliders, CheckCircle2, Circle, Sparkles, Activity, Layers, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Task, INITIAL_TASKS } from '../types';

export default function InteractiveMatrix() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(INITIAL_TASKS[0]);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  
  // Custom Task Insertion States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('个人事物');
  const [newImportance, setNewImportance] = useState(50);
  const [newUrgency, setNewUrgency] = useState(50);
  const [filterStatus, setFilterStatus] = useState<'all' | 'doing' | 'todo' | 'done'>('all');

  const matrixRef = useRef<HTMLDivElement>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);

  // Drag tracking offset variables
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Handle Drag Move (calculating inside bounding box)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggedTaskId || !matrixRef.current) return;
    const rect = matrixRef.current.getBoundingClientRect();
    
    // Relative coordinates in % (0 - 100)
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = (1 - (e.clientY - rect.top) / rect.height) * 100; // Y axis goes upwards

    // Boundaries clamping
    x = Math.max(2, Math.min(98, x));
    y = Math.max(2, Math.min(98, y));

    setTasks(prev => prev.map(t => {
      if (t.id === draggedTaskId) {
        return { 
          ...t, 
          importance: Math.round(x), 
          urgency: Math.round(y) 
        };
      }
      return t;
    }));

    // Update quadrant highlighting under coordinates
    if (x > 50 && y > 50) setActiveQuadrant('do-first');
    else if (x > 50 && y <= 50) setActiveQuadrant('plan');
    else if (x <= 50 && y > 50) setActiveQuadrant('delegate');
    else setActiveQuadrant('eliminate');
  };

  const handlePointerUp = () => {
    if (draggedTaskId) {
      const finishedDragTask = tasks.find(t => t.id === draggedTaskId);
      if (finishedDragTask) {
        setSelectedTask(finishedDragTask);
      }
      setDraggedTaskId(null);
      setActiveQuadrant(null);
    }
  };

  useEffect(() => {
    const handleGlobalRelease = () => {
      setDraggedTaskId(null);
      setActiveQuadrant(null);
    };
    window.addEventListener('mouseup', handleGlobalRelease);
    return () => window.removeEventListener('mouseup', handleGlobalRelease);
  }, []);

  // Sync selected task info with coordinate changes
  const activeSelectedTask = tasks.find(t => t.id === selectedTask?.id) || selectedTask;

  // Add customized task programmatically
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Pick distinct color representation depending on position
    let baseColor = '#1d4ed8'; // Primary blue
    if (newImportance > 50 && newUrgency > 50) baseColor = '#ef4444'; // Red for urgent-important
    else if (newImportance > 50 && newUrgency <= 50) baseColor = '#10b981'; // Green for plan
    else if (newImportance <= 50 && newUrgency > 50) baseColor = '#f59e0b'; // Amber for delegate
    else baseColor = '#94a3b8'; // Slate for gray eliminate

    const added: Task = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      importance: newImportance,
      urgency: newUrgency,
      progress: 0,
      color: baseColor,
      status: 'todo',
      category: newCategory,
      subtasks: [
        { title: '制定行动分解方案', completed: false },
        { title: '录入优先级看板', completed: true }
      ]
    };

    setTasks(prev => [...prev, added]);
    setSelectedTask(added);
    setNewTitle('');
    
    // Quick success animation trigger
    const alertBanner = document.getElementById('success-pill');
    if (alertBanner) {
      alertBanner.classList.remove('opacity-0');
      alertBanner.classList.add('opacity-100');
      setTimeout(() => {
        alertBanner.classList.remove('opacity-100');
        alertBanner.classList.add('opacity-0');
      }, 2000);
    }
  };

  // Toggle subtask status
  const handleToggleSubtask = (taskId: string, subtaskIndex: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = [...t.subtasks];
        updatedSubs[subtaskIndex] = {
          ...updatedSubs[subtaskIndex],
          completed: !updatedSubs[subtaskIndex].completed
        };
        const completedCount = updatedSubs.filter(s => s.completed).length;
        const totalCount = updatedSubs.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        return {
          ...t,
          subtasks: updatedSubs,
          progress: progressPercent,
          status: progressPercent === 100 ? 'done' : progressPercent > 0 ? 'doing' : 'todo'
        };
      }
      return t;
    }));
  };

  // Delete task from grid
  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }
  };

  // Reset entire dashboard
  const handleReset = () => {
    setTasks(INITIAL_TASKS);
    setSelectedTask(INITIAL_TASKS[0]);
  };

  // Quadrant classification description helpers
  const getQuadrantLabel = (x: number, y: number) => {
    if (x > 50 && y > 50) return { title: '重要又紧急', desc: '立即处理 (Do First)', color: 'text-red-500 bg-red-50 border-red-200' };
    if (x > 50 && y <= 50) return { title: '重要不紧急', desc: '计划推进 (Plan)', color: 'text-emerald-500 bg-emerald-50 border-emerald-200' };
    if (x <= 50 && y > 50) return { title: '紧急不重要', desc: '减少打断 (Delegate)', color: 'text-amber-500 bg-amber-50 border-amber-200' };
    return { title: '不重要不紧急', desc: '延后或放弃 (Eliminate)', color: 'text-slate-500 bg-slate-100 border-slate-200' };
  };

  // Filtering implementation
  const filteredTasks = tasks.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="w-full">
      {/* Visual Matrix Interactive Sandbox Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Drag Canvas (Grid Columns 8/12) */}
        <div className="lg:col-span-8 bg-white border border-brand-border rounded-xl p-5 shadow-xs relative">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-brand-border/60 mb-6 gap-3">
            <div>
              <h3 className="font-display font-bold text-[#111827] text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                优先级坐标轴决策空间
              </h3>
              <p className="text-xs text-gray-500 mt-1">鼠标按住彩色任务点拖拽，体验实时转换象限与动态优先级分配</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-slate-50 hover:bg-slate-100 border border-brand-border transition cursor-pointer"
                title="重置测试沙盒任务点"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>初始化点阵</span>
              </button>
              
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-sm">
                当前显示: {tasks.length} 坐标项
              </span>
            </div>
          </div>

          {/* Interactive Absolute Coordinate Box Stage */}
          <div 
            ref={matrixRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handlePointerUp}
            onMouseUp={handlePointerUp}
            className="w-full aspect-[4/3.1] border-2 border-brand-text/50 bg-[#fbfcfd] rounded-lg relative overflow-hidden matrix-grid select-none cursor-crosshair group duration-200"
          >
            {/* Quadrant Separation Axis Lines Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              
              {/* Vertical Urgency Line (X: 50%) */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400/80 z-10"></div>
              
              {/* Horizontal Importance Line (Y: 50%) */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-400/80 z-10"></div>
              
              {/* Grid Outer Labels & Quadrant Watermarks */}
              {/* Top-Right: Q1 */}
              <div className={`absolute top-4 right-4 p-3 rounded-lg text-right select-none transition-colors ${activeQuadrant === 'do-first' ? 'bg-rose-50/70 border border-rose-200' : ''}`}>
                <span className="text-[11px] font-mono font-bold text-rose-500 block">QUADRANT I</span>
                <span className="text-xs font-bold font-display text-rose-950 uppercase">重要且紧急 (Do First)</span>
              </div>
              
              {/* Bottom-Right: Q2 */}
              <div className={`absolute bottom-4 right-4 p-3 rounded-lg text-right select-none transition-colors ${activeQuadrant === 'plan' ? 'bg-emerald-50/70 border border-emerald-200' : ''}`}>
                <span className="text-[11px] font-mono font-bold text-emerald-500 block">QUADRANT II</span>
                <span className="text-xs font-bold font-display text-emerald-950 uppercase">重要不紧急 (Plan)</span>
              </div>

              {/* Top-Left: Q3 */}
              <div className={`absolute top-4 left-4 p-3 rounded-lg text-left select-none transition-colors ${activeQuadrant === 'delegate' ? 'bg-amber-50/70 border border-amber-200' : ''}`}>
                <span className="text-[11px] font-mono font-bold text-amber-500 block">QUADRANT III</span>
                <span className="text-xs font-bold font-display text-amber-950 uppercase">紧急不重要 (Delegate)</span>
              </div>

              {/* Bottom-Left: Q4 */}
              <div className={`absolute bottom-4 left-4 p-3 rounded-lg text-left select-none transition-colors ${activeQuadrant === 'eliminate' ? 'bg-slate-100/70 border border-slate-200' : ''}`}>
                <span className="text-[11px] font-mono font-bold text-slate-400 block">QUADRANT IV</span>
                <span className="text-xs font-bold font-display text-slate-900 uppercase">不重要不紧急 (Postpone)</span>
              </div>

              {/* Graphical axis arrows */}
              <div className="absolute left-1/2 top-4 -translate-x-1/2 flex items-center space-x-1">
                <span className="text-[10px] font-sans font-bold text-gray-500 bg-white/90 px-1.5 py-0.5 rounded border border-brand-border select-none uppercase tracking-widest flex items-center gap-1">纵轴: 紧急程度</span>
              </div>

              <div className="absolute bottom-5 right-12 flex items-center space-x-1">
                <span className="text-[10px] font-sans font-bold text-gray-500 bg-white/90 px-1.5 py-0.5 rounded border border-brand-border select-none uppercase tracking-widest flex items-center gap-1">横轴: 重要程度</span>
              </div>
            </div>

            {/* Render Task Dots Inside 2D Space */}
            {tasks.map((task) => {
              const isSelected = selectedTask?.id === task.id;
              const isHovered = hoveredTask?.id === task.id;
              // Map percentage coords to absolute px inside client render bounding area
              return (
                <div
                  key={task.id}
                  onMouseDown={() => {
                    setDraggedTaskId(task.id);
                    setSelectedTask(task);
                  }}
                  onMouseEnter={() => setHoveredTask(task)}
                  onMouseLeave={() => setHoveredTask(null)}
                  className="absolute cursor-grab active:cursor-grabbing z-30"
                  style={{
                    left: `${task.importance}%`,
                    bottom: `${task.urgency}%`,
                    transform: 'translate(-50%, 50%)' // Center anchor onto coordinate point
                  }}
                >
                  <div className="relative group/dot">
                    {/* Glowing outer pulse animation for active selection */}
                    <div 
                      className={`absolute inset-0 rounded-full transition-all duration-300 ${
                        isSelected 
                          ? 'scale-200 blur-xs' 
                          : isHovered 
                            ? 'scale-150 blur-xs' 
                            : 'scale-100 opacity-0'
                      }`}
                      style={{ 
                        backgroundColor: task.color,
                        opacity: isSelected ? 0.35 : isHovered ? 0.2 : 0
                      }}
                    />

                    {/* Highly stylized 3D styled glossy dot */}
                    <div 
                      className={`w-6 h-6 rounded-full border-2 border-white shadow-md transition-transform duration-200 flex items-center justify-center ${
                        isSelected ? 'scale-125 ring-2 ring-primary/40' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: task.color }}
                    >
                      {/* Optional check or progress tick inside completed items */}
                      {task.progress === 100 && (
                        <span className="block w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white rounded-full"></span>
                      )}
                    </div>

                    {/* Overlay dynamic text bubble label (matches application screenshot EXACTLY) */}
                    <div 
                      className={`absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap py-1 px-2.5 rounded-md text-[11px] font-medium border transition-all duration-150 shadow-xs pointer-events-none select-none max-w-44 truncate ${
                        isSelected 
                          ? 'bg-brand-text text-white border-brand-text scale-102 z-40' 
                          : isHovered 
                            ? 'bg-slate-900 text-white border-slate-900 scale-100 z-30'
                            : 'bg-white/95 text-gray-800 border-brand-border/80 scale-95 z-20'
                      }`}
                    >
                      {task.progress > 0 && task.progress < 100 && (
                        <span className="font-mono text-[10px] font-bold text-accent-blue mr-1 bg-accent-blue/10 px-1 rounded">
                          {task.progress}%
                        </span>
                      )}
                      {task.title}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Drag tracking guidance overlays */}
            {draggedTaskId && (
              <div className="absolute inset-0 pointer-events-none bg-primary/2 z-20 border border-primary/25 rounded-lg flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-primary bg-white/95 px-3 py-1.5 rounded-full border shadow-md animate-bounce flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
                  矩阵运算中...
                </span>
              </div>
            )}
          </div>

          {/* Add Task Quick Form Drawer Inside Dashboard */}
          <form onSubmit={handleAddTask} className="mt-6 p-4 rounded-xl border border-brand-border bg-slate-50/60 shadow-xs">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" /> 录入测试任务并动态定位
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">任务名称 (Task Title)</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如: 编写 React 19 新架构方案..."
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-brand-border bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">重要度: {newImportance}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newImportance}
                  onChange={(e) => setNewImportance(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">紧急度: {newUrgency}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newUrgency}
                  onChange={(e) => setNewUrgency(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg text-sm font-semibold bg-[#111827] text-white hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>投射至决策坐标</span>
                </button>
              </div>
            </div>
            
            <div id="success-pill" className="opacity-0 transition-opacity duration-300 absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 任务点成功抛物飞入矩阵中！
            </div>
          </form>
        </div>

        {/* Right Side: Deep Control Panel (Grid Columns 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Frosted Details Board for Selected Task */}
          <div className="bg-white border border-brand-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-brand-border/60">
              <span className="text-[10px] font-mono tracking-widest font-bold text-gray-400 block uppercase">Selected Task Focus</span>
              <h3 className="font-display font-bold text-[#111827] text-md flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                优先级深度解析板
              </h3>
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {activeSelectedTask ? (
                  <motion.div
                    key={activeSelectedTask.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: activeSelectedTask.color }} 
                        />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{activeSelectedTask.category}</span>
                      </div>
                      <h4 className="text-base font-bold text-brand-text mt-1.5 leading-snug">{activeSelectedTask.title}</h4>
                    </div>

                    {/* Coordinate Indicator Grid Panel */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-brand-border/50 text-center font-mono">
                      <div>
                        <span className="block text-[10px] font-semibold text-gray-400 mb-0.5 uppercase">重要程度 (X)</span>
                        <span className="text-base font-bold text-primary">{activeSelectedTask.importance}%</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-gray-400 mb-0.5 uppercase">紧急程度 (Y)</span>
                        <span className="text-base font-bold text-secondary">{activeSelectedTask.urgency}%</span>
                      </div>
                    </div>

                    {/* Dynamic Quadrant Conclusion Banner */}
                    <div className={`p-3 rounded-lg border text-xs leading-relaxed ${getQuadrantLabel(activeSelectedTask.importance, activeSelectedTask.urgency).color}`}>
                      <div className="font-bold flex items-center justify-between mb-1">
                        <span>决策结论: {getQuadrantLabel(activeSelectedTask.importance, activeSelectedTask.urgency).title}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-white/70 rounded">
                          {getQuadrantLabel(activeSelectedTask.importance, activeSelectedTask.urgency).desc}
                        </span>
                      </div>
                      使用艾森豪威尔模型分析该项在核心战略中占的比值较高，应遵循此决策建议尽快推进。
                    </div>

                    {/* Inline Checklist Tracker */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">推进步骤拆解 ({activeSelectedTask.progress}%)</span>
                        {activeSelectedTask.progress === 100 && (
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">DONE</span>
                        )}
                      </div>
                      
                      {activeSelectedTask.subtasks.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {activeSelectedTask.subtasks.map((sub, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleToggleSubtask(activeSelectedTask.id, idx)}
                              className="w-full text-left p-2 rounded bg-white hover:bg-slate-50/80 border border-brand-border/40 text-xs text-gray-700 flex items-start space-x-2 transition-colors cursor-pointer"
                            >
                              {sub.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5 hover:text-primary" />
                              )}
                              <span className={`block leading-tight ${sub.completed ? 'line-through text-gray-400 font-medium' : 'font-medium'}`}>
                                {sub.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-slate-50/50 rounded-lg border border-dashed border-brand-border/80 text-xs text-gray-400">
                          暂无二级步骤，点击任务列表或添加子目标
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-brand-border/50">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(activeSelectedTask.id, e)}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>移除该任务</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                    <p className="font-semibold text-slate-500">点击画布上的彩色点或右侧清单</p>
                    <p className="text-[11px] text-gray-400">我们将深度输出该维度的决策轨迹</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Task List View (Matching the right side of screenshot) */}
          <div className="bg-white border border-brand-border rounded-xl shadow-xs p-4 flex flex-col h-80">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/60 mb-3">
              <span className="font-display font-medium text-[#111827] text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#111827]" />
                任务池快照清单 ({tasks.length})
              </span>
              
              <div className="flex space-x-1">
                {(['all', 'doing', 'todo', 'done'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold capitalize select-none transition-colors ${
                      filterStatus === st 
                        ? 'bg-[#111827] text-white' 
                        : 'bg-slate-100 text-gray-500 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? '全部' : st === 'doing' ? '进行' : st === 'todo' ? '未开始' : '完成'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const isSel = selectedTask?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSel 
                          ? 'bg-blue-50/50 border-blue-200 shadow-xs' 
                          : 'bg-white hover:bg-slate-50 border-brand-border/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        {/* Colored left strip indicating category */}
                        <div 
                          className="w-1.5 h-7 rounded-sm shrink-0" 
                          style={{ backgroundColor: task.color }} 
                        />
                        <div className="truncate">
                          <span className="font-semibold text-gray-950 block truncate">{task.title}</span>
                          <span className="text-[10px] text-gray-400 block font-sans mt-0.5">
                            {task.category} · X:{task.importance}% Y:{task.urgency}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {task.progress > 0 && (
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                            {task.progress}%
                          </span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          task.status === 'done' 
                            ? 'bg-emerald-500' 
                            : task.status === 'doing' 
                              ? 'bg-blue-500 animate-pulse' 
                              : 'bg-slate-300'
                        }`} />
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          className="text-gray-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 md:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-gray-400">
                  无匹配条件下的过滤任务项
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
