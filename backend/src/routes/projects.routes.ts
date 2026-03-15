import { Types } from "mongoose";
import { HistoryModel } from "../models/History";
import express, { Router } from "express";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import Agent from "../agents/agent";
import { getModel } from "../pipeline/main";
import { sendProgress } from "../socket";

const projectRouter: Router = express.Router();

// list all chat titles for user
projectRouter.get("/user/:userid/chats", async (req, res) => {
  try {
    const { userid } = req.params;
    if (!userid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const chats = await HistoryModel.find({ userUid: userid })
      .select("chatId chatTitle createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .exec();

    return res.json(chats);
  } catch (error) {
    return res.status(400).json({ message: "internal server error" });
  }
});

// get chat by id
projectRouter.get("/user/:userid/chats/:chatid", async (req, res) => {
  try {
    const { userid, chatid } = req.params;
    if (!userid || !chatid) {
      return res.status(400).json({ error: "User ID and Chat ID are required" });
    }

    const chat = await HistoryModel.findOne({ userUid: userid, chatId: chatid }).exec();
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json(chat);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// create chat (each chat must have userUid)
projectRouter.post("/user/:userid/chats", async (req, res) => {
  try {
    const { userid } = req.params;
    const { chatTitle, chatId } = req.body;

    if (!userid) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const newChat = new HistoryModel({
      userUid: userid,
      chatId: chatId || new Types.ObjectId().toString(),
      chatTitle: chatTitle || "New Chat",
      messages: [],
    });

    await newChat.save();
    return res.status(201).json(newChat);
  } catch (error) {
    return res.status(500).json({ error: "Failed to create chat" });
  }
});

// add basic message
projectRouter.post("/user/:userid/chats/:chatid/messages", async (req, res) => {
  try {
    const { userid, chatid } = req.params;
    const { role, content } = req.body;

    if (!userid || !chatid) {
      return res.status(400).json({ error: "User ID and Chat ID are required" });
    }

    if (!role || !content) {
      return res.status(400).json({ error: "role and content are required" });
    }

    const chat = await HistoryModel.findOne({ userUid: userid, chatId: chatid }).exec();
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const message = {
      messageId: new Types.ObjectId().toString(),
      role,
      content,
      createdAt: new Date(),
    };

    chat.messages.push(message);
    await chat.save();


    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: "Failed to add message" });
  }
});

// generate assistant reply from backend agent and store in chat
projectRouter.post("/user/:userid/chats/:chatid/reply", async (req, res) => {
  try {
    const { userid, chatid } = req.params;
    const { prompt, feedId } = req.body;

    if (!userid || !chatid) {
      return res.status(400).json({ error: "User ID and Chat ID are required" });
    }

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }

    const chat = await HistoryModel.findOne({ userUid: userid, chatId: chatid }).exec();

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    sendProgress(userid, "Analyzing context...");

    const contextWindow = chat.messages
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    sendProgress(userid, "Fetching internal data...");

    const models = ['employees', 'projects', 'tools', 'project history'];
    const data = await Promise.all(models.map(async (model) => {
      const Model = getModel(model);
      // Fetch data specifically for this user's feed, vastly trim limit & omit metadata
      return await Model.find({ feedId: feedId || userid })
        .limit(5)
        .select("-_id -__v -createdAt -updatedAt -feedId -userUid")
        .lean()
        .exec();
    }));

    sendProgress(userid, "Thinking...");

    // data[0]=employees, data[1]=projects, data[2]=tools, data[3]=history
    const agent = new Agent();
    const response = await agent.general([
      new SystemMessage(
        `You are **TaskMinds AI Assistant**, an intelligent project planning and workforce allocation assistant.

Your responsibilities include:

* Answering questions about employees, projects, tools, and project history
* Helping with project planning and task breakdown
* Suggesting employee assignments based on skills
* Recommending appropriate tools for tasks

You are provided with internal organizational data. Use it as your **ground truth** when answering.

DATASET RULES:

* The following collections contain structured information:

  * employees
  * projects
  * tools
  * project_history

* Ignore database metadata fields such as:
  \`_id\`, \`__v\`, \`createdAt\`, \`updatedAt\`, \`feedId\`

* Only use meaningful fields such as:
  employee names, skills, roles, project names, priorities, required skills, and tool capabilities.

BEHAVIOR RULES:

1. Answer **briefly and clearly**.
2. If the user asks about assignments, match **employee skills with project requirements**.
3. If the user asks about tools, recommend tools that match required skills.
4. If information is missing from the dataset, say **"This information is not available in the current dataset."**
5. Never invent employees, projects, or tools that are not present in the data.
6. Prefer structured responses (bullet points or short lists) when helpful.

DATA PROVIDED:

Employees:
${JSON.stringify(data[0])}

Projects:
${JSON.stringify(data[1])}

Tools:
${JSON.stringify(data[2])}

Project History:
${JSON.stringify(data[3])}

Use this dataset to answer the user's questions accurately.
`

      ),
      new HumanMessage(
        `Conversation:\n${contextWindow}\n\nLatest user prompt:\n${prompt}`,
      ),
    ]);

    sendProgress(userid, "Formatting response...");

    console.log(response)
    const assistantMessage = {
      messageId: new Types.ObjectId().toString(),
      role: "assistant" as const,
      content: response,
      createdAt: new Date(),
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    return res.status(201).json(assistantMessage);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate assistant reply" });
  }
});

// rename chat
projectRouter.put("/user/:userid/chats/:chatid/rename", async (req, res) => {
  try {
    const { userid, chatid } = req.params;
    const { chatTitle } = req.body;

    if (!userid || !chatid || !chatTitle) {
      return res.status(400).json({ error: "User ID, Chat ID, and Chat Title are required" });
    }

    const chat = await HistoryModel.findOne({ userUid: userid, chatId: chatid }).exec();
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    chat.chatTitle = chatTitle;
    await chat.save();

    return res.json({ message: "Chat renamed successfully", chatTitle });
  } catch (error) {
    return res.status(500).json({ error: "Failed to rename chat" });
  }
});

// delete chat
projectRouter.delete("/user/:userid/chats/:chatid", async (req, res) => {
  try {
    const { userid, chatid } = req.params;
    if (!userid || !chatid) {
      return res.status(400).json({ error: "User ID and Chat ID are required" });
    }

    const chat = await HistoryModel.findOneAndDelete({ userUid: userid, chatId: chatid }).exec();
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete chat" });
  }
});

export default projectRouter;
