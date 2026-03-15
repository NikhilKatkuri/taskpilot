import mongoose from "mongoose";

async function run() {
    await mongoose.connect("mongodb://localhost:27017/taskminds");

    try {
        const db = mongoose.connection.db;
        if (db) {
            await db.collection("employees").dropIndex("employee_id_1").catch(() => console.log("No employee_id index to drop"));
            await db.collection("projects").dropIndex("project_id_1").catch(() => console.log("No project_id index to drop"));
            console.log("Unique indexes dropped.");
        }
    } catch (e) {
        console.log(e);
    }

    process.exit(0);
}

run();
