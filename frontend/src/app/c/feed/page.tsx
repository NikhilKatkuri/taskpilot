"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { feedPipeline } from "@/lib/chatApi";
import { auth } from "@/lib/firebase";

export default function FeedPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        setStatus("idle");
        setErrorMsg("");

        try {
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

            const praseSkills = (content: string): string[] => {
                if (!content) return [];
                return content.split(";").map((skill) => skill.trim());
            };

            const praseContent = (content: string) => {
                const lines = content
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line.length > 0);

                if (lines.length === 0) return [];

                const headers = lines[0].split(",").map((header) => header.trim());
                const rows = lines.slice(1);

                return rows.map((row) => {
                    const values = row.split(",").map((value) => value.trim());
                    const obj: { [key: string]: string | string[] } = {};

                    headers.forEach((header, index) => {
                        obj[header] = values[index];
                    });

                    if (obj["skills"]) obj["skills"] = praseSkills(obj["skills"] as string);
                    if (obj["required_skills"]) obj["required_skills"] = praseSkills(obj["required_skills"] as string);
                    if (obj["tools_used"]) obj["tools_used"] = praseSkills(obj["tools_used"] as string);

                    return obj;
                });
            };

            const csvData = await Promise.all(
                Array.from(files).map(async (file) => {
                    const text = await file.text();
                    return {
                        fileName: replaceName(file.name),
                        content: praseContent(text),
                    };
                })
            );

            const feedId = auth.currentUser?.uid;

            if (!feedId) {
                throw new Error("You must be logged in to upload a dataset");
            }

            await feedPipeline(feedId, csvData);
            setStatus("success");
        } catch (err: any) {
            console.error("Feed error:", err);
            setStatus("error");
            setErrorMsg(err.message || "An unknown error occurred");
        } finally {
            setLoading(false);
            e.target.value = ""; // Reset file input
        }
    };

    return (
        <div className="flex h-svh w-full flex-col bg-[#fafafa] dark:bg-[#000000] p-6 lg:p-12 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-3">
                            <Database className="h-7 w-7 text-blue-500" />
                            Data Pipeline Feed
                        </h1>
                        <p className="mt-2 text-[15px] text-zinc-500">
                            Upload and parse CSV datasets to compile into your agent's knowledge graph.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/c")}
                        className="rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 px-4 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Back to Chat
                    </button>
                </div>

                <div className="relative mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] px-6 py-20 text-center transition-colors hover:border-blue-500 dark:hover:border-blue-500/50 group">
                    <input
                        type="file"
                        multiple
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={loading}
                        className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="rounded-full bg-blue-50 dark:bg-blue-500/10 p-5 mb-6 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">
                        {loading ? "Processing files..." : "Upload CSV Datasets"}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-500 max-w-sm">
                        {loading
                            ? "Parsing columns and injecting into knowledge base. Please hold."
                            : "Drag and drop your project datasets (.csv) here, or click to browse files."
                        }
                    </p>
                </div>

                {status === "success" && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 p-5 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold">Upload Successful</h4>
                            <p className="mt-1 text-sm opacity-90">All provided CSV datasets have been normalized, parsed, and piped into the backend successfully.</p>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 p-5 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold">Pipeline Error</h4>
                            <p className="mt-1 text-sm opacity-90">{errorMsg}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
