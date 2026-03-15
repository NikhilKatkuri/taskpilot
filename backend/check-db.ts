import mongoose from "mongoose";
import { EmployeeModel, ProjectModel, ToolModel, ProjectHistoryModel } from "./src/models/data";

async function main() {
    await mongoose.connect("mongodb://localhost:27017/taskminds");
    const emp = await EmployeeModel.find().limit(1).lean();
    const proj = await ProjectModel.find().limit(1).lean();
    const tool = await ToolModel.find().limit(1).lean();
    const hist = await ProjectHistoryModel.find().limit(1).lean();

    console.log("Sample Employee:", JSON.stringify(emp, null, 2));
    console.log("Sample Project:", JSON.stringify(proj, null, 2));
    console.log("Sample Tool:", JSON.stringify(tool, null, 2));
    console.log("Sample History:", JSON.stringify(hist, null, 2));

    process.exit(0);
}

main().catch(console.error);
