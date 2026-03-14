// normalizer.ts

export const SKILL_MAP: Record<string, string> = {
  ml: "machine learning",
  "machine learning": "machine learning",
  llm: "llm",
  llms: "llm",
  nlp: "nlp",
  rag: "rag",
  api: "api",
  apis: "api",
  python: "python",
  pandas: "pandas",
  react: "react",
  javascript: "javascript",
  "node.js": "nodejs",
  nodejs: "nodejs",
  databases: "database",
  database: "database",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
};

export const cleanSkill = (skill: string): string => {
  const s = skill.trim().toLowerCase();
  return SKILL_MAP[s] || s;
};

export const normalizeSkills = (skills: string[]): string[] => {
  return [...new Set(skills.map(cleanSkill))];
};
