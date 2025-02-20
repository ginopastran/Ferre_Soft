import { getChatsByUserId } from "@/lib/db/queries";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const chats = await getChatsByUserId({ id: session.user.id.toString() });
  return Response.json(chats);
}
