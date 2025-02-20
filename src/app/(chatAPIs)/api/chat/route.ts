import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";
import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from "ai";

import { customModel } from "@/lib/ai";
import { models } from "@/lib/ai/models";
import { getSystemPrompt } from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";

import { generateTitleFromUserMessage } from "../../../admin/paltai/actions";
import { createDocument } from "@/lib/ai/tools/create-document";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { getWeather } from "@/lib/ai/tools/get-weather";

export const maxDuration = 60;

type AllowedTools =
  | "createDocument"
  | "updateDocument"
  | "requestSuggestions"
  | "getWeather";

const blocksTools: AllowedTools[] = [
  "createDocument",
  "updateDocument",
  "requestSuggestions",
];

const weatherTools: AllowedTools[] = ["getWeather"];
const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

export async function POST(request: Request) {
  try {
    const session = await getSession(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, messages, modelId } = await request.json();

    const model = models.find((model) => model.id === modelId);

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });
      await saveChat({ id, userId: session.user.id, title });
    }

    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    const systemPrompt = await getSystemPrompt();

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: customModel(model.apiIdentifier),
          system: systemPrompt,
          messages,
          maxSteps: 5,
          experimental_activeTools: allTools,
          experimental_transform: smoothStream({ chunking: "word" }),
          experimental_generateMessageId: generateUUID,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream, model }),
            updateDocument: updateDocument({ session, dataStream, model }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
              model,
            }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const responseMessagesWithoutIncompleteToolCalls =
                  sanitizeResponseMessages(response.messages);

                await saveMessages({
                  messages: responseMessagesWithoutIncompleteToolCalls.map(
                    (message) => {
                      return {
                        id: message.id,
                        chatId: id,
                        role: message.role,
                        content: message.content,
                        createdAt: new Date(),
                      };
                    }
                  ),
                });
              } catch (error) {
                console.error("Failed to save chat");
              }
            }
          },
          experimental_telemetry: {
            isEnabled: true,
            functionId: "stream-text",
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error) {
    console.error("Error en la API de chat:", error);
    return new Response(
      JSON.stringify({ error: "Error procesando la solicitud" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await getSession(request);

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat?.userId !== session.user.id.toString()) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
