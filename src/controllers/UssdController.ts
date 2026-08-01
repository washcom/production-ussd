import { Request, Response } from "express";
import { UssdService } from "../services/UssdService";
import { UssdFlowService } from "../services/UssdFlowService";
import { SessionStore } from "../services/SessionStore";

const ussd = new UssdService();
const sessions = new SessionStore();
const flow = new UssdFlowService(ussd, sessions);

export async function webhook(req: Request, res: Response): Promise<void> {
  const incoming = ussd.parseIncoming(req.body, req.query);

  if (!incoming.sessionId || !incoming.phone) {
    res.set("Content-Type", "text/plain").send("END Invalid request.");
    return;
  }

  let reply;
  try {
    reply = await flow.handle(incoming);
  } catch (err) {
    console.error("[USSD] Handler error:", err);
    reply = ussd.end("An error occurred. Please dial again.");
  }

  res.set("Content-Type", "text/plain").send(ussd.render(reply));
}
