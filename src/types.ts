export interface SubTodo {
  completed: boolean;
  id: string;
  title: string;
}

export interface MatrixTask {
  id: string;
  title: string;
  notes: string;
  subtasks: SubTodo[];
  importance: number;
  urgency: number;
  color: string;
  progress: number;
  autoProgress: boolean;
  showOnAxis: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMetrics {
  importance: number;
  urgency: number;
  progress: number;
}

export interface TaskFormValues extends TaskMetrics {
  title: string;
  notes: string;
  subtasks: SubTodo[];
  color: string;
  autoProgress: boolean;
  showOnAxis: boolean;
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'axis';
