<div align="center">
  <img src="./frontend/public/globe.svg" width="100" />
  <h1>TaskMinds - Advanced AI Agent</h1>
  <p>An intelligent AI agent platform built for project planning, dynamic task breakdown, and automated workforce allocation.</p>
  
  <p>
    <b>Team</b>: Stratify Minds <br/>
    <b>Members</b>: Nikhil Katkuri, Niveditha Katta
  </p>
</div>

<br/>

## 💡 The Idea
Managing agile engineering and business teams requires knowing exactly who is available, mapping their unique skills to dynamic project requirements, safely allocating the best development tools, and seamlessly scaling task logic.

**The Problem:** Traditional enterprise resource management dashboards are passive and heavily manual. Searching through isolated datasets for employees, managing constraints, and architecting project pipelines is stressful and prone to blind spots.

## 🚀 The Solution: TaskMinds
TaskMinds is a deterministic, AI-first workforce allocation assistant. Instead of passive UI graphs, TaskMinds inherently understands your entire internal organization and executes requests autonomously using multi-step pipelines.

- **Automated Data Pipelines**: A dedicated UI feed dashboard that drops raw CSV organizational datasets, normalizes them in the browser, and pipes them directly to isolated database clusters.
- **Context-Aware Agent Engine**: High-speed AI inference (powered by Groq `llama-3.3-70b`) structured securely via LangChain schemas. The agent acts on a real-time, sandboxed subset of your active database (Employees, Projects, Tools, History).
- **Real-Time Websocket Tracing**: No more "frozen" loading screens. As the internal AI logic progresses natively through its pipeline, it streams its sub-states (*"Analyzing context..."*, *"Fetching internal data..."*, *"Thinking..."*) directly to the user's interactive chat prompt using `Socket.io`.
- **Beautiful Enterprise UI**: Sleek dark-mode compatible interface built completely with pristine Radix and Tailwind components, featuring optimistic UI chat editing and fully transient multi-tenant sessions via Firebase Auth.

---

## 🛠️ Key Tech Stack

**Frontend Framework Components:**
- Next.js 16 (App Router) + React 19 (Turbopack)
- Tailwind CSS v4 + native raw CSS configuration
- shadcn/ui + Radix UI Primitives 
- Firebase Auth 

**Agent & Backend Architecture:**
- Node.js + Express.js backend (TypeScript)
- LangChain Core + Groq SDK integrations
- Socket.io (for real-time pipeline event streams)
- MongoDB via Mongoose (Multi-tenant optimized database queries)

---

## 📂 Project Structure

```text
taskpilot/
├── frontend/                 # NextJS Application
│   ├── src/app/
│   │   ├── c/page.tsx        # Main Agent Chat UI
│   │   └── c/feed/page.tsx   # CSV Data Ingestion Hub
│   ├── src/components/       # UI building blocks (Sidebar, PromptBox)
│   └── src/lib/              # chatApi, socket managers, firebase config
│   
└── backend/                  # Node/Express Service
    ├── src/agents/           # Custom Langchain Agent Handlers
    ├── src/models/           # MongoDB schemas (Employees, Projects, Tools)
    ├── src/pipeline/         # AI planning models, tool matchers, CSV normalizers
    ├── src/routes/           # App routes
    └── src/socket.ts         # Central WebSocket broadcast service
```

---

## 🏎️ Getting Started

### 1. Prerequisites
Ensure you have the following installed locally:
- **Node.js** (v20+)
- **pnpm** package manager
- **MongoDB** running natively on `localhost:27017`
- A **Firebase** Web Project (for client-side auth keys)
- A **Groq Cloud** API Key

### 2. Environment Variables

Create and fill out `.env` files in both directories.

**`backend/.env`**
```env
TASKMINDS_APP_NODE_ENV=development
TASKMINDS_APP_PORT=4000
TASKMINDS_APP_HOST=0.0.0.0

TASKMINDS_APP_DATABASE_URL=mongodb://localhost:27017/taskminds
TASKMINDS_APP_CORS_ORIGINS=http://localhost:3000

# Your Groq AI API Key 
TASKMINDS_APP_GROQ_API_KEY=gsk_your_groq_api_key_here
```

**`frontend/.env.local`** (or `.env`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1

# Firebase configuration values
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Installation & Run Instructions

**Start the MongoDB Database**
Ensure your local mongo daemon is running. Open your terminal:
```bash
# If using brew on macOS
brew services start mongodb-community
```

**Boot the Node Express/Agent Backend**
```bash
cd backend
pnpm install
pnpm run dev
```

**Boot the Next.js Client**
Open a new terminal session.
```bash
cd frontend
pnpm install
pnpm run dev
```

The application client will be exposed at **`http://localhost:3000`**. You can now login, load `.csv` datasets via the Feed dashboard, and chat with your fully localized organizational AI!
