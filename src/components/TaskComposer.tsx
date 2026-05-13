import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface TaskComposerProps {
  onAddTask: (task: {
    title: string;
    notes: string;
    importance: number;
    urgency: number;
    showOnAxis: boolean;
  }) => void;
}

export function TaskComposer({ onAddTask }: TaskComposerProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [importance, setImportance] = useState(60);
  const [urgency, setUrgency] = useState(50);
  const [showOnAxis, setShowOnAxis] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    onAddTask({ title, notes, importance, urgency, showOnAxis });
    setTitle('');
    setNotes('');
    setImportance(60);
    setUrgency(50);
    setShowOnAxis(true);
  }

  return (
    <form className="task-composer" onSubmit={handleSubmit}>
      <div>
        <h2>添加任务</h2>
        <p>任务会立即保存到此设备，无需账号或网络。</p>
      </div>

      <label>
        <span>任务标题</span>
        <input
          autoComplete="off"
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例如：完成离线数据方案"
          value={title}
        />
      </label>

      <label>
        <span>备注</span>
        <textarea
          maxLength={180}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="补充上下文、负责人或下一步动作"
          rows={3}
          value={notes}
        />
      </label>

      <div className="metric-fields" aria-label="任务指标">
        <label>
          <span>重要程度 {importance}</span>
          <input
            max={100}
            min={0}
            onChange={(event) => setImportance(Number(event.target.value))}
            type="range"
            value={importance}
          />
        </label>
        <label>
          <span>紧急程度 {urgency}</span>
          <input
            max={100}
            min={0}
            onChange={(event) => setUrgency(Number(event.target.value))}
            type="range"
            value={urgency}
          />
        </label>
      </div>

      <label className="axis-checkbox">
        <input
          checked={showOnAxis}
          onChange={(event) => setShowOnAxis(event.target.checked)}
          type="checkbox"
        />
        <span>显示在坐标轴上</span>
      </label>

      <button className="primary-button" disabled={!title.trim()} type="submit">
        <Plus size={18} aria-hidden="true" />
        添加任务
      </button>
    </form>
  );
}
