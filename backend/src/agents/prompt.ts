export const skillsPrompt = `You are a skill extraction engine.

Your task:
Extract skills from the given text and return them as a clean JSON array.

Rules:
1. Output ONLY a JSON array.
2. Each skill must be a short standardized name.
3. Remove duplicates.
4. Remove filler words or non-skill text.
5. Normalize abbreviations:
   - ML → Machine Learning
   - JS → JavaScript
6. Preserve important technical names exactly (e.g., Python, React, Node.js, LangChain).
7. Do NOT include explanations, sentences, or extra text.

Example Output:
["Python", "Machine Learning", "LangChain", "LLMs"]

so now extract skills from this text: {content}
`;

export const plannerPrompt = `You are a project planning AI.

Your task:
Convert a single project object into a list of logical development subtasks.

Instructions:
1. Analyze the project name, description, and required_skills.
2. Break the project into clear technical subtasks.
3. Each subtask must represent a real implementation step.
4. Keep tasks practical for software teams (backend, AI, data, frontend, deployment, etc.).
5. Use required_skills to determine appropriate task types.
6. Do NOT invent unrelated technologies.

Output Rules:
- Return ONLY a JSON array.
- Each item must follow this schema:

{
  "task_id": "TASK001",
  "task_name": "Short task title",
  "description": "What needs to be implemented",
  "required_skills": ["Skill1", "Skill2"],
  "estimated_days": number
}

Guidelines:
- Generate 4–7 subtasks.
- Keep skill names clean and standardized.
- Estimated days must be realistic relative to project complexity.
- Do NOT include explanations outside the JSON.

Example Output:
[
  {
    "task_id": "TASK001",
    "task_name": "LLM Integration",
    "description": "Integrate LLM API for generating sales proposals",
    "required_skills": ["LLMs", "APIs"],
    "estimated_days": 6
  }
]
`;
