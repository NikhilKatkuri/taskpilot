import Agent from "../agents/agent";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { plannerPrompt } from "../agents/prompt";
import { task, Project } from "../types";
import { normalizeSkills } from "./normalizer";

export const planner = async (project: Project): Promise<task[]> => {
  const agent = new Agent();
  const data: Project = {
    project_id: project.project_id,
    project_name: project.project_name,
    priority: project.priority,
    required_skills: normalizeSkills(project.required_skills),
    description: project.description,
    deadline_days: project.deadline_days,
  };
  const messages = [
    new SystemMessage(plannerPrompt),
    new HumanMessage(`Here is the project data: ${JSON.stringify(project)}`),
  ];

  const response = await agent.general(messages);
  const tasks = JSON.parse(response) as task[];

  return tasks.map((t) => ({
    ...t,
    required_skills: normalizeSkills(t.required_skills),
  }));
};
