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
): Promise<string> => {
  // Fetch chatbot system prompt
  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("system_prompt")
    .eq("id", chatbotId)
    .single();

  if (error || !chatbot) {
    console.error("Error fetching chatbot:", error);
    return (
      "Sorry, I am not able to answer that right now. Please try again later. error: " +
      JSON.stringify(error)
    );
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
        rpc.eq("metadata->chatbot_id", JSON.stringify(chatbotId)),
    });

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      apiKey: Deno.env.OPENAI_API_KEY,
      callbacks: [{
        handleLLMEnd(output){
          if(!output.generations?.[0]?.[0]?.text){
            console.error("generation doesn't exist or doesn't have a text")
            return;
          }
          supabase
          .from("ai_chat_messages")
          .insert({
            chatbot_id: chatbotId,
            user_program: userProgram,
            content: output.generations?.[0]?.[0]?.text,
            role: "ai",
            tokens_used: output.llmOutput?.tokenUsage?.totalTokens || null
          })
          .then(({ error }) => {
            if (error) {
              console.error("Error inserting message:", error);
            }
          });
        },
        handleLLMError(error){
          console.error("An error occurred with LLM invoke", error.message || error)
        }
      }]
    });

    let systemMessage =
      "You are provided multiple context items that are related to the prompt you have to answer. Use the following pieces of context to answer the question at the end.\n\n{context}";
    if (chatbot.system_prompt) {
      systemMessage = chatbot.system_prompt + "\n\n" + systemMessage;
    }

    const { data: messages, error: messagesError } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("id", chatbotId)
      .eq("user_program", userProgram)
      .order("created_at", { ascending: false })
      .limit(5);

    if (messagesError || messages?.[0]?.role !== "user") {
      console.error("Error fetching last messages:", messagesError);
      return (
        "Sorry, I am not able to answer that right now. Please try again later. error: " +
        JSON.stringify(messagesError)
      );
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

    return response.answer;
  } catch (e) {
    console.error(e);
    return (
      "Sorry, I am not able to answer that right now. Please try again later.\n" +
      e +
      "\n" +
      chatbotId
    );
  }
};
