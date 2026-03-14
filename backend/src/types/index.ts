export type Project = {
  project_id: string;
  project_name: string;
  description: string;
  required_skills: string[];
  deadline_days: string;
  priority: string;
};

export interface DataFile {
  fileName: string;
  content: Record<string, any>[];
}

export interface LoadedData {
  employees: Record<string, any>[];
  projects: Record<string, any>[];
  history: Record<string, any>[];
  resources: Record<string, any>[];
}

export interface task {
  task_id: string;
  task_name: string;
  description: string;
  required_skills: string[];
  estimated_days: number;
  project_id: string;
}

export interface assignedTaskTo extends task {
  project_id: string;
  employee_id: string;
  employee_name: string;
  score: number;
  assigned_resources: string[];
}

export interface employee {
  employee_id: string;
  name: string;
  role: string;
  skills: string[];
  experience_years: number;
  current_workload_percent: number;
}
