import fs from "fs";
import path from "path";

const testCSVs = path.join(__dirname, "sample");

const csvFiles = fs
  .readdirSync(testCSVs)
  .filter((file) => file.endsWith(".csv"));

/*
--------------------------------
Normalize File Name
--------------------------------
*/
const replaceName = (name: string) => {
  return name
    .replace("neurax", "")
    .replace("dataset", "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace(".csv", "")
    .trim()
    .toLowerCase();
};

/*
--------------------------------
Skill Parsing
--------------------------------
*/
const praseSkills = (content: string): string[] => {
  if (!content) return [];
  return content.split(";").map((skill) => skill.trim());
};

/*
--------------------------------
CSV Content Parser
--------------------------------
*/
const praseContent = (content: string) => {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const headers = lines[0].split(",").map((header) => header.trim());

  const rows = lines.slice(1);

  const objects = rows.map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const obj: { [key: string]: string | string[] } = {};

    headers.forEach((header, index) => {
      obj[header] = values[index];
    });

    if (obj["skills"]) {
      obj["skills"] = praseSkills(obj["skills"] as string);
    }

    if (obj["required_skills"]) {
      obj["required_skills"] = praseSkills(obj["required_skills"] as string);
    }

    if (obj["tools_used"]) {
      obj["tools_used"] = praseSkills(obj["tools_used"] as string);
    }

    return obj;
  });

  return objects;
};

/*
--------------------------------
Main CSV Generator
--------------------------------
*/
const generateCSVData = async () => {
  const csvData = await Promise.all(
    csvFiles.map(async (file) => {
      const filePath = path.join(testCSVs, file);

      const content = await fs.promises.readFile(filePath, "utf-8");

      return {
        fileName: replaceName(file),
        content: praseContent(content),
      };
    }),
  );

  await fs.promises.writeFile(
    path.join(__dirname, "data.json"),
    JSON.stringify(csvData, null, 2),
    "utf-8",
  );

  console.log("✅ data.json generated successfully");
};

/*
--------------------------------
Run
--------------------------------
*/
generateCSVData().catch(console.error);
