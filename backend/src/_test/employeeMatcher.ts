// employeeMatcher.ts

import { employee, task } from "../types";
import { cleanSkill } from "./normalizer";

export const assignEmployee = (
  tasks: task[],
  employees: employee[],
  projectPriority: string,
) => {
  const assignments: Record<string, string> = {};

  // track number of tasks assigned per employee
  const taskCount: Record<string, number> = {};

  employees.forEach((emp) => {
    taskCount[emp.employee_id] = 0;
  });

  for (const task of tasks) {
    let bestScore = -Infinity;
    let bestEmployee = "";

    for (const emp of employees) {
      // optional hard limit
      if (taskCount[emp.employee_id] >= 3) {
        continue;
      }

      const skillMatch = task.required_skills.filter((skill) =>
        emp.skills.map(cleanSkill).includes(cleanSkill(skill)),
      ).length;

      const exp = Number(emp.experience_years);
      const workload = Number(emp.current_workload_percent) / 100;

      const assignedTasks = taskCount[emp.employee_id];

      const fairnessPenalty = assignedTasks * 0.4;
      const roleMatch = task.task_name
        .toLowerCase()
        .includes(emp.role.toLowerCase())
        ? 1
        : 0;
      const priorityWeight = projectPriority === "HIGH" ? 0.3 : 0;
      const score =
        skillMatch * 0.45 +
        roleMatch * 0.25 +
        exp * 0.15 +
        (1 - workload) * 0.15 +
        priorityWeight -
        fairnessPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestEmployee = emp.employee_id;
      }
    }

    assignments[task.task_id] = bestEmployee;

    // update tracking after assignment
    taskCount[bestEmployee] += 1;

    const emp = employees.find((e) => e.employee_id === bestEmployee);

    if (emp) {
      emp.current_workload_percent += 10;
    }
  }

  return assignments;
};
