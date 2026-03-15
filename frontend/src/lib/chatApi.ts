export interface ChatMeta {
  chatId: string;
  chatTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  messageId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface ChatDoc extends ChatMeta {
  userUid: string;
  messages: ChatMessage[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

const ensureOk = async (response: Response) => {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response;
};

export const listChats = async (userId: string): Promise<ChatMeta[]> => {
  const response = await fetch(`${API_BASE}/user/${userId}/chats`, {
    method: "GET",
    cache: "no-store",
  });

  await ensureOk(response);
  return (await response.json()) as ChatMeta[];
};

export const getChatById = async (
  userId: string,
  chatId: string,
): Promise<ChatDoc> => {
  const response = await fetch(`${API_BASE}/user/${userId}/chats/${chatId}`, {
    method: "GET",
    cache: "no-store",
  });

  await ensureOk(response);
  return (await response.json()) as ChatDoc;
};

export const createChat = async (
  userId: string,
  chatTitle = "New Chat",
): Promise<ChatDoc> => {
  const response = await fetch(`${API_BASE}/user/${userId}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatTitle }),
  });

  await ensureOk(response);
  return (await response.json()) as ChatDoc;
};

export const addMessage = async (
  userId: string,
  chatId: string,
  payload: Pick<ChatMessage, "role" | "content">,
): Promise<ChatMessage> => {
  const response = await fetch(
    `${API_BASE}/user/${userId}/chats/${chatId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  await ensureOk(response);
  return (await response.json()) as ChatMessage;
};

export const getAssistantReply = async (
  userId: string,
  chatId: string,
  prompt: string,
): Promise<ChatMessage> => {
  const response = await fetch(
    `${API_BASE}/user/${userId}/chats/${chatId}/reply`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    },
  );

  await ensureOk(response);
  return (await response.json()) as ChatMessage;
};

export const deleteChat = async (userId: string, chatId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/${userId}/chats/${chatId}`, {
    method: "DELETE",
  });

  await ensureOk(response);
};

export const renameChat = async (userId: string, chatId: string, chatTitle: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/user/${userId}/chats/${chatId}/rename`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chatTitle }),
  });

  await ensureOk(response);
};

export const feedPipeline = async (feedId: string, data: any): Promise<void> => {
  const response = await fetch(`${API_BASE}/project/pipeline/feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ feedId, data }),
  });

  await ensureOk(response);
};

export const runPipeline = async (userId: string, chatId: string, feedId: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/project/pipeline/run/${userId}/${chatId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ feedId, userId }),
  });

  await ensureOk(response);
  return await response.json();
};
