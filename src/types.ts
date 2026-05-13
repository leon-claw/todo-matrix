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

export type TaskFilter = 'all' | 'active' | 'completed';
