import { Save } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import type { MatrixTask, TaskFormValues } from '../types';

interface TaskComposerProps {
  initialTask?: MatrixTask | null;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSubmit: (task: TaskFormValues) => void;
}

const emptyTask: TaskFormValues = {
  title: '',
  notes: '',
  importance: 60,
  urgency: 50,
  showOnAxis: true,
};

function getInitialValues(task?: MatrixTask | null): TaskFormValues {
  if (!task) {
    return emptyTask;
  }

  return {
    title: task.title,
    notes: task.notes,
    importance: task.importance,
    urgency: task.urgency,
    showOnAxis: task.showOnAxis,
  };
}

export function TaskComposer({
  initialTask,
  mode,
  onCancel,
  onSubmit,
}: TaskComposerProps) {
  const [values, setValues] = useState<TaskFormValues>(() => getInitialValues(initialTask));

  useEffect(() => {
    setValues(getInitialValues(initialTask));
  }, [initialTask]);

  function updateValue<Key extends keyof TaskFormValues>(key: Key, value: TaskFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      return;
    }

    onSubmit(values);
  }

  return (
    <form className="task-composer" onSubmit={handleSubmit}>
      <div>
        <h2>{mode === 'create' ? '添加任务' : '编辑任务'}</h2>
      </div>

      <label>
        <span>任务标题</span>
        <input
          autoComplete="off"
          maxLength={80}
          onChange={(event) => updateValue('title', event.target.value)}
          placeholder="例如：完成离线数据方案"
          value={values.title}
        />
      </label>

      <label>
        <span>备注</span>
        <textarea
          maxLength={180}
          onChange={(event) => updateValue('notes', event.target.value)}
          placeholder="补充上下文、负责人或下一步动作"
          rows={3}
          value={values.notes}
        />
      </label>

      <div className="metric-fields" aria-label="任务指标">
        <label>
          <span>重要程度 {values.importance}</span>
          <input
            max={100}
            min={0}
            onChange={(event) => updateValue('importance', Number(event.target.value))}
            type="range"
            value={values.importance}
          />
        </label>
        <label>
          <span>紧急程度 {values.urgency}</span>
          <input
            max={100}
            min={0}
            onChange={(event) => updateValue('urgency', Number(event.target.value))}
            type="range"
            value={values.urgency}
          />
        </label>
      </div>

      <label className="axis-checkbox">
        <input
          checked={values.showOnAxis}
          onChange={(event) => updateValue('showOnAxis', event.target.checked)}
          type="checkbox"
        />
        <span>显示在坐标轴上</span>
      </label>

      <div className="modal-actions">
        <button className="ghost-button" onClick={onCancel} type="button">
          取消
        </button>
        <button className="primary-button" disabled={!values.title.trim()} type="submit">
          <Save size={18} aria-hidden="true" />
          {mode === 'create' ? '添加任务' : '保存修改'}
        </button>
      </div>
    </form>
  );
}
