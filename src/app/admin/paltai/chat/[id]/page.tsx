import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Chat } from "@/components/chat";
import { DEFAULT_MODEL_NAME, models } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { getSession } from "@/lib/session";

type VisibilityType = "public" | "private";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await getSession(
    new Request(process.env.NEXTAUTH_URL || "http://localhost:3000")
  );

  if (chat.visibility === "private") {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id.toString() !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("model-id")?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedModelId={selectedModelId}
        selectedVisibilityType={chat.visibility as VisibilityType}
        isReadonly={session?.user?.id.toString() !== chat.userId}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
