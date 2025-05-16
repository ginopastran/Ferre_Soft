import { getSession as getSessionFromLib } from "@/lib/session";
import { NextApiRequest } from "next";

export interface SessionUser {
  id: number;
  email: string;
  role: string;
}

export async function getSession(req: NextApiRequest) {
  try {
    const session = await getSessionFromLib(req);

    if (!session || !session.user) {
      return null;
    }

    return {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}
