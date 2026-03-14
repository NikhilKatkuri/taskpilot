// main.ts

import fs from "fs";
import path from "path";

import { planner } from "./planner";
import { assignEmployee } from "./employeeMatcher";
import { assignTools } from "./toolMatcher";
import { normalizeSkills } from "./normalizer";

import { employee, Project, task } from "../types";

/*
--------------------------------
Load Data
--------------------------------
*/
const loadData = () => {
  const dataPath = path.join(__dirname, "data.json");
  const raw = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  let employees: employee[] = [];
  let projects: Project[] = [];
  let tools: any[] = [];

  for (const file of raw) {
    if (file.fileName === "employees") {
      employees = file.content.map((emp: any) => ({
        ...emp,
        skills: normalizeSkills(emp.skills),
      }));
    }

    if (file.fileName === "projects") {
      projects = file.content;
    }

    if (file.fileName === "tools") {
      tools = file.content;
    }
  }

  return { employees, projects, tools };
};

/*
--------------------------------
Console Table
--------------------------------
*/
const printAssignmentTable = (
  projectId: string,
  tasks: task[],
  employees: employee[],
  empAssignments: Record<string, string>,
  toolAssignments: Record<string, any[]>,
) => {
  const rows = tasks.map((task) => {
    const empId = empAssignments[task.task_id];
    const emp = employees.find((e) => e.employee_id === empId);
    const tools = toolAssignments[task.task_id] || [];

    return {
      Project: projectId,
      Task: task.task_name,
      Employee: emp?.name || "Unassigned",
      Role: emp?.role || "-",
      Tools: tools.map((t) => t.tool_name).join(", ") || "None",
    };
  });

  console.table(rows);
};

/*
--------------------------------
Cache planner results by skill signature
--------------------------------
*/
const getPlannerCacheKey = (project: Project): string => {
  return `${project.priority}_${project.required_skills}`;
};

/*
--------------------------------
Main Pipeline
--------------------------------
*/
const main = async () => {
  const { employees, projects, tools } = loadData();

  const plannerCache: Record<string, task[]> = {};
  let llmCallCount = 0;

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const cacheKey = getPlannerCacheKey(project);

    console.log("\n=================================================");
    console.log(
      `Processing Project ${i + 1}/${projects.length} → ${project.project_name}`,
    );
    console.log("=================================================\n");

    /*
    ------------------------------
    LLM Planner with Cache
    ------------------------------
    */

    let tasks: task[];

    if (plannerCache[cacheKey]) {
      console.log("Using cached planner result\n");
      tasks = plannerCache[cacheKey];
    } else {
      console.log("Generating tasks using LLM...");
      tasks = await planner(project);
      plannerCache[cacheKey] = tasks;
      llmCallCount++;
      console.log(`LLM Call #${llmCallCount}\n`);
    }

    /*
    ------------------------------
    Employee Assignment
    ------------------------------
    */

    console.log("Assigning employees...");
    const empAssign = assignEmployee(tasks, employees, project.priority);

    /*
    ------------------------------
    Tool Assignment
    ------------------------------
    */

    console.log("Assigning tools...");
    const toolAssign: Record<string, any[]> = {};

    for (const task of tasks) {
      toolAssign[task.task_id] = assignTools(task.required_skills, tools);
    }

    /*
    ------------------------------
    Print Results Immediately
    ------------------------------
    */

    printAssignmentTable(project.project_id, tasks, employees, empAssign, toolAssign);

    /*
    ------------------------------
    Save individual project result
    ------------------------------
    */

    fs.writeFileSync(
      path.join(__dirname, `result_${project.project_id}.json`),
      JSON.stringify(
        {
          project: project,
          tasks: tasks,
          employeeAssignments: empAssign,
          toolAssignments: toolAssign,
        },
        null,
        2,
      ),
    );

    console.log(`✓ Project ${project.project_id} completed\n`);
  }

  console.log("=================================================");
  console.log(`✓ All ${projects.length} assignments completed!`);
  console.log(`LLM Calls: ${llmCallCount}/${projects.length} (${((llmCallCount / projects.length) * 100).toFixed(1)}%)`);
  console.log("=================================================");
};

main();
