// toolMatcher.ts

export interface Tool {
  tool_id: string;
  tool_name: string;
  tool_type: string;
  purpose: string;
}

export const assignTools = (skills: string[], tools: Tool[]) => {
  const skillSet = skills.map((s) => s.toLowerCase());

  return tools.filter((tool) => {
    const purpose = tool.purpose.toLowerCase();
    const type = tool.tool_type.toLowerCase();

    return skillSet.some(
      (skill) => purpose.includes(skill) || type.includes(skill),
    );
  });
};
