import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
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
  message: string,
  isAdmin = false
): Promise<string> => {
  // Fetch chatbot system prompt
  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("system_prompt")
    .eq("id", chatbotId)
    .single();

  if (error || !chatbot) {
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
    });

    let systemMessage =
      "You are provided multiple context items that are related to the prompt you have to answer. Use the following pieces of context to answer the question at the end.\n\n{context}";
    if (chatbot.system_prompt) {
      systemMessage = chatbot.system_prompt + "\n\n" + systemMessage;
    }

    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      ["system", systemMessage],
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
      input: message,
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
