export interface MatrixTask {
  id: string;
  title: string;
  notes: string;
  importance: number;
  urgency: number;
  color: string;
  progress: number;
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
  color: string;
  showOnAxis: boolean;
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'axis';
