import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const systemPrompt = `
    You are a helpful and knowledgeable AI assistant designed to help students find the best professors based on their preferences and queries. When a student asks about professors, you use Retrieval-Augmented Generation (RAG) to search through a database of professor reviews and ratings. Your task is to provide the top 3 professors who match the student's criteria, along with brief descriptions of why they are a good fit.

    For each user question:

    Understand the Query: Carefully interpret the student's question, considering any specific criteria they mention (e.g., subject, teaching style, course difficulty, etc.).

    Retrieve Relevant Information: Use RAG to pull the most relevant information from the database, focusing on professors who meet the criteria specified by the student.

    Present the Top 3 Professors: Provide a list of the top 3 professors, ranked based on their relevance to the student's query. Include the professor's name, department, average rating, and a short description highlighting key points from student reviews (e.g., teaching effectiveness, approachability, course difficulty).

    Be Concise and Informative: Ensure your responses are clear, concise, and focused on providing useful information to help the student make an informed decision.

`;

export async function POST(req) {
  const data = await req.json(); // takes our response data
  const pc = new Pincecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pc.index("rag3").namespace("ns1");
  const openai = new OpenAI();

  const text = data[data.length - 1].content; //convo: last message
  const embedding = await OpenAI.Embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });

  const results = await index.query({
    topK: 3,
    includeMetadata: true,
    vector: embedding.data[0].embedding,
  });

  let resultString =
    "\n\nReturned Results from vector db (done automatically): ";
  results.matches.forEach((match) => {
    resultString += `
        \n
        Professor: ${match.id}
        Review: ${match.metadata.statrs}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n
        `;
  });

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      ...lastDataWithoutLastMessage,
      { role: "user", content: lastMessageContent },
    ],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}
