import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const embeddings = new OpenAIEmbeddings({
  apiKey: Deno.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
});

export const getChatbotResponse = async (
  chatbotId: string,
  userProgram: string
): Promise<{ answer: string; context: any[] }> => {
  // Fetch chatbot system prompt
  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("system_prompt")
    .eq("id", chatbotId)
    .single();

  if (error || !chatbot) {
    console.error("Error fetching chatbot:", error);
    return {
      answer:
        "Sorry, I am not able to answer that right now. Please try again later. error: " +
        JSON.stringify(error),
      context: [],
    };
  }
  try {
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: "ai_vectors",
      queryName: "search_ai_documents",
    });

    const retriever = vectorStore.asRetriever({
      k: 5,
      searchType: "similarity",
      filter: (rpc) =>
        rpc.filter("metadata->>chatbot_id", "eq", String(chatbotId)),
    });

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      apiKey: Deno.env.OPENAI_API_KEY,
      callbacks: [
        {
          handleLLMEnd(output) {
            if (!output.generations?.[0]?.[0]?.text) {
              console.error("generation doesn't exist or doesn't have a text");
              return;
            }
            supabase
              .from("ai_chat_messages")
              .insert({
                chatbot_id: chatbotId,
                user_program: userProgram,
                content: output.generations?.[0]?.[0]?.text,
                role: "ai",
                tokens_used: output.llmOutput?.tokenUsage?.totalTokens || null,
              })
              .then(({ error }) => {
                if (error) {
                  console.error("Error inserting message:", error);
                }
              });
          },
          handleLLMError(error) {
            console.error(
              "An error occurred with LLM invoke",
              error.message || error
            );
            supabase
              .from("ai_chat_messages")
              .insert({
                chatbot_id: chatbotId,
                user_program: userProgram,
                content:
                  "Sorry, I am not able to answer that right now. Please try again later. error: " +
                  JSON.stringify(error),
                role: "ai",
                tokens_used: null,
              })
              .then(({ error }) => {
                if (error) {
                  console.error("Error inserting message:", error);
                }
              });
          },
        },
      ],
    });

    let systemMessage =
      "Use the following pieces of context to answer the question at the end. If the question isn't addressed at all by the context, please ask the user to contact the trainer. Do not answer queries completely outside the scope of the context.\n\n{context}";
    if (chatbot.system_prompt) {
      systemMessage = chatbot.system_prompt + "\n\n" + systemMessage;
    }

    const { data: messages, error: messagesError } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("chatbot_id", chatbotId)
      .eq("user_program", userProgram)
      .order("created_at", { ascending: false })
      .limit(5);

    if (messagesError || messages?.[0]?.role !== "user") {
      console.error("Error fetching last messages:", messagesError);
      return {
        answer:
          "Sorry, I am not able to answer that right now. Please try again later. error: " +
          JSON.stringify(messagesError),
        context: [],
      };
    }

    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemMessage],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
    ]);

    const combineDocsChain = await createStuffDocumentsChain({
      llm: model,
      prompt: questionAnsweringPrompt,
    });

    const chain = await createRetrievalChain({
      retriever,
      combineDocsChain,
    });

    const response = await chain.invoke({
      input: messages[0]?.content || "",
      chat_history: messages
        .slice(1)
        .map((msg) =>
          msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
        ),
    });

    return { answer: response.answer, context: response.context };
  } catch (e) {
    console.error(e);
    const answer =
      "Sorry, I am not able to answer that right now. Please try again later.\n" +
      e +
      "\n" +
      chatbotId;
    return {
      answer,
      context: [],
    };
  }
};
