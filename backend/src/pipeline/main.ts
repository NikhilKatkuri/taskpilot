import { Request, Response } from "express";
import {
  EmployeeModel,
  ProjectHistoryModel,
  ProjectModel,
  ToolModel,
} from "../models/data";
import mongoose, { Model } from "mongoose";
import { employee, Project, task } from "../types";
import { assignEmployee } from "./employeeMatcher";
import { planner } from "./planner";
import { assignTools, Tool } from "./toolMatcher";
import { sendProgress } from "../socket";

const getPlannerCacheKey = (project: Project): string => {
  return `${project.priority}_${project.required_skills}`;
};

const pipeline = async (req: Request, res: Response) => {
  try {
    const { feedId, userId } = req.body;

    if (!feedId || !userId) {
      return res.status(400).json({ message: "feedId and userId required" });
    }

    sendProgress(userId, "Pipeline started");

    const employees = await EmployeeModel.find({ feedId });
    const projects = await ProjectModel.find({ feedId });
    const tools = await ToolModel.find({ feedId });

    if (!employees.length || !projects.length || !tools.length) {
      sendProgress(userId, "Dataset missing");
      return res.status(404).json({ message: "Dataset incomplete" });
    }

    const plannerCache: Record<string, task[]> = {};
    let llmCalls = 0;

    const results: any[] = [];

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];

      sendProgress(userId, `Processing project ${i + 1}/${projects.length}`);

      const cacheKey = getPlannerCacheKey(project as unknown as Project);

      let tasks: task[];

      if (plannerCache[cacheKey]) {
        tasks = plannerCache[cacheKey];
      } else {
        sendProgress(userId, "Running LLM planner...");

        tasks = await planner(project as unknown as Project);

        plannerCache[cacheKey] = tasks;
        llmCalls++;
      }

      sendProgress(userId, "Assigning employees...");

      const empAssign = assignEmployee(
        tasks,
        employees as unknown as employee[],
        project.priority as string,
      );

      sendProgress(userId, "Assigning tools...");

      const toolAssign: Record<string, any[]> = {};

      for (const task of tasks) {
        toolAssign[task.task_id] = assignTools(task.required_skills, tools as Tool[]);
      }

      const projectResult = {
        projectId: project.project_id,
        tasks,
        employees: empAssign,
        tools: toolAssign,
      };

      results.push(projectResult);

      sendProgress(userId, `Project ${project.project_name} completed`);
    }

    sendProgress(userId, "Pipeline finished");

    return res.json({
      message: "Pipeline completed",
      llmCalls,
      results,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Pipeline failed" });
  }
};

export const getModel = (fileName: string): Model<any> => {
  switch (fileName.toLowerCase()) {
    case "employees":
      return EmployeeModel as unknown as Model<any>;

    case "projects":
      return ProjectModel as unknown as Model<any>;

    case "project history":
      return ProjectHistoryModel as unknown as Model<any>;

    case "tools":
      return ToolModel as unknown as Model<any>;

    default:
      throw new Error(`Model not found for fileName: ${fileName}`);
  }
};

const feed = async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "Database connection is not ready",
      });
    }

    const { data, feedId } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: "Invalid data format" });
    }

    console.log("Dataset received. Files:", data.length);

    for (const dataset of data) {
      const { fileName, content } = dataset;

      const Model = getModel(fileName);

      if (!Array.isArray(content) || content.length === 0) continue;

      // Ensure we clear previous copies of this specific dataset for the user to prevent duplication
      await Model.deleteMany({ feedId });

      const documents = content.map((item) => ({
        ...item,
        feedId,
      }));

      await Model.insertMany(documents);

      console.log(`Inserted ${documents.length} records into ${fileName}`);
    }

    res.json({
      message: "Dataset stored successfully",
      feedId,
    });
  } catch (error: any) {
    console.error("Feed error:", error);

    res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

export { feed, pipeline };
