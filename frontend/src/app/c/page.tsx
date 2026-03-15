"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Ghost, Image as ImageIcon, CircleSlash2, Activity } from "lucide-react";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";
import {
  ChatDoc,
  addMessage,
  createChat,
  deleteChat,
  getAssistantReply,
  getChatById,
  listChats,
  runPipeline,
  renameChat,
} from "@/lib/chatApi";

export default function Chat() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);
  const [chats, setChats] = useState<{ chatId: string; chatTitle?: string; createdAt?: string; updatedAt?: string }[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [socketMsg, setSocketMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit("join", userId);

    const onProgress = (data: { message: string; time: string }) => {
      setSocketMsg(data.message);
      console.log(`[Socket] ${data.message} @ ${data.time}`);
    };

    socket.on("pipeline-progress", onProgress);

    return () => {
      socket.off("pipeline-progress", onProgress);
      socket.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
      setProfileName(user?.displayName || null);
      setProfileEmail(user?.email || null);

      if (!user) {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadChats = async (uid: string) => {
    const data = await listChats(uid);
    setChats(data);

    if (data.length > 0 && !activeChatId) {
      const firstId = data[0].chatId;
      setActiveChatId(firstId);
      const chat = await getChatById(uid, firstId);
      setActiveChat(chat);
    }
  };

  useEffect(() => {
    if (!userId) {
      setChats([]);
      setActiveChat(null);
      setActiveChatId(null);
      return;
    }

    void loadChats(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleCreateChat = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const created = await createChat(userId, "New Chat");
      setChats((prev) => [created, ...prev]);
      setActiveChatId(created.chatId);
      setActiveChat(created);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      const chat = await getChatById(userId, chatId);
      setActiveChatId(chatId);
      setActiveChat(chat);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      await deleteChat(userId, chatId);
      const remaining = chats.filter((chat) => chat.chatId !== chatId);
      setChats(remaining);

      if (activeChatId === chatId) {
        if (remaining.length > 0) {
          const nextId = remaining[0].chatId;
          setActiveChatId(nextId);
          const chat = await getChatById(userId, nextId);
          setActiveChat(chat);
        } else {
          setActiveChatId(null);
          setActiveChat(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!userId) return;

    try {
      // Optimistically update UI
      setChats((prev) =>
        prev.map((c) => c.chatId === chatId ? { ...c, chatTitle: newTitle } : c)
      );
      if (activeChat?.chatId === chatId) {
        setActiveChat((prev) => prev ? { ...prev, chatTitle: newTitle } : prev);
      }

      await renameChat(userId, chatId, newTitle);
    } catch (error) {
      console.error("Failed to rename chat:", error);
      // Revert if API fails? For simplicity let's optionally just log it 
      // User would refresh to get original state, but usually the PUT works fine
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!userId) return;

    setLoading(true);
    setSocketMsg("Processing Request...");
    try {
      let chatId = activeChatId;

      if (!chatId) {
        const created = await createChat(userId, content.slice(0, 32));
        chatId = created.chatId;
        setChats((prev) => [created, ...prev]);
        setActiveChatId(chatId);
        setActiveChat(created);
      }

      const message = await addMessage(userId, chatId, {
        role: "user",
        content,
      });

      const assistant = await getAssistantReply(userId, chatId, content);

      setActiveChat((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          messages: [...prev.messages, message, assistant],
        };
      });

      setChats((prev) =>
        prev.map((chat) =>
          chat.chatId === chatId
            ? { ...chat, chatTitle: chat.chatTitle || content.slice(0, 32) }
            : chat,
        ),
      );
    } finally {
      setLoading(false);
      setSocketMsg(null);
    }
  };

  const handleRunPipeline = async () => {
    if (!userId || !activeChatId) {
      alert("Select a chat first to map pipeline");
      return;
    }
    setLoading(true);
    setSocketMsg("Booting pipeline...");
    try {
      const feedId = auth.currentUser?.uid || "umcJhP6aqVOYcJ8E18TgXooFknt1";
      await runPipeline(userId, activeChatId, feedId);
    } catch (e: any) {
      alert("Pipeline error: " + e.message);
    } finally {
      setLoading(false);
      setSocketMsg(null);
    }
  };

  const messages = useMemo(() => activeChat?.messages || [], [activeChat]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[#fafafa] dark:bg-[#000000] font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <div className="flex h-full flex-col overflow-hidden md:flex-row">

        {/* Sidebar Section */}
        <Sidebar
          chats={chats}
          selectedChatId={activeChatId}
          profileName={profileName}
          profileEmail={profileEmail}
          onLogout={handleLogout}
          onCreateChat={handleCreateChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
        />

        {/* Main Content Area */}
        <div className="flex h-full w-full flex-1 flex-col overflow-hidden pb-4 md:pb-6 relative">




          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden">
            {messages.length === 0 ? (
              // Empty State (Initial Screen)
              <div className="flex h-full flex-col items-center justify-center -mt-16 px-4">
                <div className="flex items-center gap-3 mb-8 opacity-90 transition-opacity hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black">
                    <CircleSlash2 className="h-7 w-7" strokeWidth={2.5} />
                  </div>
                  <h1 className="text-4xl sm:text-[44px] font-bold tracking-tight text-zinc-950 dark:text-zinc-50 ">
                    TaskMinds
                  </h1>
                </div>
                <div className="w-full max-w-175 mt-2 relative">
                  {loading && socketMsg && (
                    <div className="absolute -top-10 left-0 right-0 flex justify-center animate-fade-in">
                      <div className="flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <Activity className="h-3 w-3 animate-pulse" />
                        {socketMsg}
                      </div>
                    </div>
                  )}
                  <PromptBox onSend={handleSendMessage} disabled={loading || !userId} />
                </div>
              </div>
            ) : (
              // Conversation State
              <>
                <div className="w-full flex-1 overflow-y-auto px-4 pb-4 pt-16 md:px-0 scroll-smooth">
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 pb-10">
                    {messages.map((message) => (
                      <div key={message.messageId} className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 text-[15px] leading-[1.6] shadow-sm ${message.role === "user"
                            ? "rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50"
                            : "rounded-2xl bg-white dark:bg-[#151515] text-zinc-800 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                            }`}
                        >
                          <div className="flex flex-col">
                            {message.role === "assistant" && (
                              <div className="flex items-center gap-2 mb-2">
                                <CircleSlash2 className="h-4 w-4 text-zinc-400" />
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">TaskMinds</span>
                              </div>
                            )}
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className="min-h-[1em]">{line}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mx-auto w-full max-w-175 px-4 md:px-0 relative">
                  {loading && socketMsg && (
                    <div className="absolute -top-10 left-0 right-0 flex justify-center animate-fade-in">
                      <div className="flex items-center gap-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <Activity className="h-3 w-3 animate-pulse" />
                        {socketMsg}
                      </div>
                    </div>
                  )}
                  <PromptBox onSend={handleSendMessage} onMic={handleRunPipeline} disabled={loading || !userId} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
