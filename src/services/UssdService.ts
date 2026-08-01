import { UssdIncoming, UssdReply } from "../types/ussd";

/**
 * Thin transport layer for the USSD gateway (Africa's Talking compatible).
 * The gateway POSTs `sessionId`, `phoneNumber`, `serviceCode` and `text`
 * (the full chain of user inputs joined by `*`); the response is plain text
 * prefixed with `CON ` (keep session open) or `END ` (terminate).
 */
export class UssdService {
  parseIncoming(body: any, query: any = {}): UssdIncoming {
    const src = { ...(query || {}), ...(body || {}) };

    const sessionId = String(
      src.sessionId ?? src.session_id ?? src.SessionId ?? src.SESSION_ID ?? "",
    );
    let phone = String(
      src.phoneNumber ?? src.phone_number ?? src.msisdn ?? src.MSISDN ?? "",
    );
    const serviceCode = String(
      src.serviceCode ?? src.service_code ?? src.USSDCODE ?? "",
    );
    const text = String(src.text ?? src.input ?? "");

    phone = phone.replace(/\s+/g, "").replace(/^\+/, "");

    const parts = text.split("*");
    const input = parts.length ? parts[parts.length - 1].trim() : "";

    return { sessionId, phone, serviceCode, text, input };
  }

  con(body: string): UssdReply {
    return { type: "CON", body };
  }

  end(body: string): UssdReply {
    return { type: "END", body };
  }

  render(reply: UssdReply): string {
    return `${reply.type} ${reply.body}`.trim();
  }
}
