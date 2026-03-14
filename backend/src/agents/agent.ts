import {
  MessageStructure,
  MessageToolSet,
} from "@langchain/core/dist/messages/message";
import { ENV } from "../lib/env";
import { ChatGroq } from "@langchain/groq";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

class Agent {
  private groq: ChatGroq;
  constructor() {
    this.groq = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      apiKey: ENV.groqApiKey, 
    });
  }

  public async tools(){
    
  }
  public async general(
    messages: (
      | SystemMessage<MessageStructure<MessageToolSet>>
      | HumanMessage<MessageStructure<MessageToolSet>>
    )[],
  ): Promise<string> {
    try {
      const response = await this.groq.invoke(messages);
      return response.content.toString();
    } catch (error) {
      console.error("Error occurred:", error);
      throw error;
    }
  }
}

export default Agent;
