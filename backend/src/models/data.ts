import { Schema, model } from "mongoose";

const EmployeeSchema = new Schema(
  {
    employee_id: { type: String },
    name: String,
    role: String,
    skills: [String],
    experience_years: Number,
    current_workload_percent: Number,
    userUid: { type: String, index: true },
    feedId: { type: String, index: true },
  },
  { timestamps: true },
);

export const EmployeeModel = model("Employee", EmployeeSchema);

const ProjectSchema = new Schema(
  {
    project_id: { type: String },
    project_name: String,
    description: String,
    required_skills: [String],
    deadline_days: Number,
    priority: String,
    userUid: String,
    feedId: { type: String, index: true },
  },
  { timestamps: true },
);

export const ProjectModel = model("Project", ProjectSchema);

const ProjectHistorySchema = new Schema(
  {
    history_id: String,
    project_id: String,
    project_name: String,
    team_size: Number,
    tools_used: [String],
    completion_days: Number,
    success_score: Number,
    userUid: String,
    feedId: { type: String, index: true },
  },
  { timestamps: true },
);

export const ProjectHistoryModel = model(
  "ProjectHistory",
  ProjectHistorySchema,
);

const ToolSchema = new Schema(
  {
    tool_id: String,
    tool_name: String,
    tool_type: String,
    purpose: String,
    feedId: { type: String, index: true },
  },
  { timestamps: true },
);

export const ToolModel = model("Tool", ToolSchema);
