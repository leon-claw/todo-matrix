export interface MatrixTask {
  id: string;
  title: string;
  notes: string;
  importance: number;
  urgency: number;
  showOnAxis: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMetrics {
  importance: number;
  urgency: number;
}

export interface TaskFormValues extends TaskMetrics {
  title: string;
  notes: string;
  showOnAxis: boolean;
}

export type TaskFilter = 'all' | 'active' | 'completed' | 'axis';
