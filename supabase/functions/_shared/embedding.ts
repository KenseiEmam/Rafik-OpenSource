import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const embeddings = new OpenAIEmbeddings({
  apiKey: Deno.env.OPENAI_API_KEY,
  model: "text-embedding-3-small",
});

export const generateAndStoreEmbeddings = async (
  chatbotId: string,
  path: string,
  type: "file" | "url"
) => {
  let documents: Document[];
  if (type === "file") {
    const { data, error } = await supabase.storage
      .from("ai_documents")
      .download(path);

    if (error) throw error;

    const buffer = Buffer.from(await data.arrayBuffer());

    const fileType = path.split(".").pop();

    let loader: BaseDocumentLoader;

    switch (fileType) {
      case "pdf":
        loader = new PDFLoader(new Blob([buffer]));
        break;
      case "docx":
        loader = new DocxLoader(new Blob([buffer]));
        break;
      case "pptx":
        loader = new PPTXLoader(new Blob([buffer]));
        break;
      case "txt":
        loader = new TextLoader(new Blob([buffer]));
        break;
      default:
        throw new Error("Unsupported file type");
    }

    documents = await loader.load();
  } else {
    // For URLs
    let loader: BaseDocumentLoader;

    if (path.includes("youtube.com") || path.includes("youtu.be")) {
      loader = YoutubeLoader.createFromUrl(path, { addVideoInfo: true });
    } else {
      loader = new CheerioWebBaseLoader(path, { maxRetries: 3 });
    }

    documents = await loader.load();
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.splitDocuments(documents);

  // Tag each embedding with the chatbot ID
  for (const doc of docs) {
    doc.metadata.chatbot_id = chatbotId;
    doc.metadata.resourceType = type;
    if (type === "file") {
      doc.metadata.fileName = JSON.stringify(path.split("/").pop());
      doc.metadata.path = path;
    }
    doc.chatbot_id = chatbotId;
  }

  const vectorStore = await SupabaseVectorStore.fromDocuments(
    docs,
    embeddings,
    {
      client: supabase,
      tableName: "ai_documents",
      queryName: "match_documents",
    }
  );
  console.log("Vector store created", vectorStore);
};
