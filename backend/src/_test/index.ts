import fs from "fs";
import path from "path";
import stream from "stream";
import csv from "csv-parser";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
// import pdf from "pdf-parse"; // Ensure you have 'pdf-parse' installed
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ENV } from "../lib/env";

// --- Types & Configuration ---

type DataType =
  | "employees"
  | "project_history"
  | "tool"
  | "projects"
  | "unknown";

interface DatasetResult {
  fileName: string;
  type: DataType;
  content: any[];
}

// --- Global Counters ---

const typeCounters: Record<DataType, number> = {
  employees: 0,
  project_history: 0,
  tool: 0,
  projects: 0,
  unknown: 0,
};

const EXPECTED_COLUMNS: Record<Exclude<DataType, "unknown">, string[]> = {
  employees: [
    "employee_id",
    "name",
    "role",
    "skills",
    "experience_years",
    "current_workload_percent",
  ],
  project_history: [
    "history_id",
    "project_id",
    "project_name",
    "team_size",
    "tools_used",
    "completion_days",
    "success_score",
  ],
  tool: ["tool_id", "tool_name", "tool_type", "purpose"],
  projects: [
    "project_id",
    "project_name",
    "description",
    "required_skills",
    "deadline_days",
    "priority",
  ],
};

// --- Helper Functions ---

const normalizeFileName = (name: string): string => {
  return name
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/\s*\(\d+\)/, "") // Remove (1), (2)
    .replace(/^(neurax_|aiml_)/i, "") // Remove prefixes
    .replace(/(_dataset|_large)$/i, "") // Remove suffixes
    .split(/[_-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const parseListField = (value: any): string[] => {
  if (typeof value !== "string" || !value) return [];
  // Handles semicolon (CSV) or comma (LLM output)
  return value
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
};

// --- Core Processor Class ---

class DataProcessor {
  private llm: ChatGroq;

  constructor() {
    this.llm = new ChatGroq({
      apiKey: ENV.groqApiKey,
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });
  }

  /**
   * 1. LOAD: Extract raw text from any supported file type
   */
  async loadRawFileContent(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);

    switch (ext) {
      case ".csv":
        return buffer.toString("utf-8");
      case ".xlsx":
      case ".xls":
        const workbook = XLSX.read(buffer);
        return XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
      case ".docx":
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
      case ".pdf":
        const pdf2text = require("pdf2text");
        const pages = await new Promise((resolve, reject) => {
          pdf2text(buffer, (error: any, pages: string[]) => {
            if (error) reject(error);
            else resolve(pages);
          });
        });
        return (pages as string[]).join("\n");
      default:
        return buffer.toString("utf-8");
    }
  }

  /**
   * 2. PARSE: Convert structured CSV-like strings to JSON objects
   */
  async parseStructuredString(content: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const s = new stream.Readable();
      s.push(content);
      s.push(null);

      s.pipe(csv())
        .on("data", (data) => {
          // Auto-clean list fields found in your CSVs
          ["skills", "required_skills", "tools_used"].forEach((key) => {
            if (data[key]) data[key] = parseListField(data[key]);
          });
          results.push(data);
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  /**
   * 3. CLASSIFY: Determine data type via heuristics or LLM
   */
  async classify(headers: string[], snippet: string): Promise<DataType> {
    // Try heuristics first
    for (const [type, expected] of Object.entries(EXPECTED_COLUMNS)) {
      const matches = expected.filter((col) => headers.includes(col)).length;
      if (matches / expected.length >= 0.5) return type as DataType;
    }

    // Heuristics failed, ask the LLM
    const prompt = `Classify this data: Headers: [${headers.join(", ")}]. 
    Content Snippet: ${snippet.slice(0, 300)}. 
    Categories: employee, project_history, tool, project. Respond with only the word.`;

    try {
      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      const result = response.content
        .toString()
        .trim()
        .toLowerCase() as DataType;
      return ["employee", "project_history", "tool", "project"].includes(result)
        ? result
        : "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * 4. EXTRACT: Use LLM to turn a PDF/Brief into a structured Project object
   */
  async extractProjectFromBrief(rawText: string): Promise<any> {
    const prompt = `
      Extract project details from this text into a JSON object.
      Required Keys:
      - project_id (Find the ID like PRJ-AIML-001)
      - project_name (The full title)
      - description (One sentence summary)
      - required_skills (Array of strings, e.g., ["NLP", "RAG"]) 
      - deadline_days (Number of days)
      - priority (High, Medium, or Low)
      Text:
      ${rawText}

      make sure to only include the JSON object in your response. Do not add any explanations or text.
      also all type of possible skills  required_skills (Array of strings, e.g., ["NLP", "RAG"]) should be included in the required_skills array. or [ "APIs", "Docker", "Kubernetes", "LLM", "LangChain", "Node.js", "Pandas", "PyTorch", "Python", "RAG", "React", "SQL", "TensorFlow", "VectorDB"] like this  
      
      Return ONLY the JSON.
    `;

    try {
      const response = await this.llm.invoke([
        new SystemMessage("You are a data extraction expert."),
        new HumanMessage(prompt),
      ]);
      const cleanJson = response.content
        .toString()
        .replace(/```json|```/g, "")
        .trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Extraction failed:", error);
      return null;
    }
  }

  /**
   * EXECUTE: Process a file from start to finish
   */
  async process(filePath: string): Promise<DatasetResult> {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const rawContent = await this.loadRawFileContent(filePath);

    // Scenario A: Unstructured Brief (PDF/Word/Text with Project indicators)
    if (
      ext === ".pdf" ||
      ext === ".docx" ||
      rawContent.includes("Functional Requirements")
    ) {
      const projectData = await this.extractProjectFromBrief(rawContent);
      return {
        fileName: "projects",
        type: "projects",
        content: projectData ? [projectData] : [],
      };
    }

    // Scenario B: Structured Data (CSV/Excel)
    const parsed = await this.parseStructuredString(rawContent);
    const headers = parsed.length > 0 ? Object.keys(parsed[0]) : [];
    const type = await this.classify(headers, rawContent);

    return {
      fileName: type,
      type,
      content: parsed,
    };
  }
}

// --- Main Runner ---

const main = async () => {
  const processor = new DataProcessor();
  const sampleDir = path.join(__dirname, "sample_2");

  if (!fs.existsSync(sampleDir)) {
    console.error("Directory './sample' not found.");
    return;
  }

  const files = fs
    .readdirSync(sampleDir)
    .filter((f) =>
      [".csv", ".xlsx", ".xls", ".docx", ".pdf"].includes(
        path.extname(f).toLowerCase(),
      ),
    );

  console.log(`🚀 Processing ${files.length} files...`);

  const results = await Promise.all(
    files.map((file) => processor.process(path.join(sampleDir, file))),
  );

  fs.writeFileSync(
    path.join(__dirname, "data.json"),
    JSON.stringify(results, null, 2),
    "utf-8",
  );

  console.log("✅ Done! Data saved to data.json");
};

main().catch(console.error);
