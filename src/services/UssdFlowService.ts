import { UssdIncoming, UssdReply, UssdSessionData } from "../types/ussd";
import { UssdService } from "./UssdService";
import { SessionStore } from "./SessionStore";
import { underwriters, findUnderwriter, findProduct } from "../data/underwriters";

/**
 * Menu state machine, mirroring cush's UssdFlowService: each step reads the
 * user's latest input against the session's current step, updates session
 * state, and returns the next screen. Purchase is mocked (logs + a
 * reference number) — swap `finalizePurchase` for a real payment/policy
 * integration when ready.
 */
export class UssdFlowService {
  constructor(
    private ussd: UssdService,
    private sessions: SessionStore,
  ) {}

  async handle(incoming: UssdIncoming): Promise<UssdReply> {
    const session = this.sessions.getOrCreate(incoming.sessionId, incoming.phone);
    const input = incoming.input;

    switch (session.step) {
      case "main_menu":
        return this.showMainMenu(session, input);
      case "select_underwriter":
        return this.handleSelectUnderwriter(session, input);
      case "select_product":
        return this.handleSelectProduct(session, input);
      case "product_detail":
        return this.handleProductDetail(session, input);
      case "enter_phone":
        return this.handleEnterPhone(session, input);
      case "confirm_purchase":
        return this.handleConfirmPurchase(session, input);
      default:
        this.sessions.end(session.sessionId);
        return this.ussd.end("Session expired. Please dial again.");
    }
  }

  private showMainMenu(
    session: ReturnType<SessionStore["getOrCreate"]>,
    input: string,
  ): UssdReply {
    if (input === "") {
      return this.ussd.con(
        "Welcome to Cush Insurance\n1. Browse underwriters\n0. Exit",
      );
    }
    if (input === "1") {
      return this.renderUnderwriterList(session);
    }
    this.sessions.end(session.sessionId);
    return this.ussd.end("Goodbye.");
  }

  private renderUnderwriterList(
    session: ReturnType<SessionStore["getOrCreate"]>,
  ): UssdReply {
    const menu_map: Record<string, string> = {};
    const lines = underwriters.map((u, i) => {
      const key = String(i + 1);
      menu_map[key] = u.id;
      return `${key}. ${u.name}`;
    });
    this.sessions.update(session.sessionId, "select_underwriter", { menu_map });
    return this.ussd.con(`Select an underwriter:\n${lines.join("\n")}`);
  }

  private handleSelectUnderwriter(
    session: ReturnType<SessionStore["getOrCreate"]>,
    input: string,
  ): UssdReply {
    const underwriterId = session.data.menu_map?.[input];
    const underwriter = underwriterId ? findUnderwriter(underwriterId) : undefined;
    if (!underwriter) {
      return this.ussd.end("Invalid selection. Please dial again.");
    }

    const menu_map: Record<string, string> = {};
    const lines = underwriter.products.map((p, i) => {
      const key = String(i + 1);
      menu_map[key] = p.id;
      return `${key}. ${p.name} - KES ${p.premium}`;
    });
    const data: UssdSessionData = { underwriter_id: underwriter.id, menu_map };
    this.sessions.update(session.sessionId, "select_product", data);
    return this.ussd.con(`${underwriter.name} products:\n${lines.join("\n")}`);
  }

  private handleSelectProduct(
    session: ReturnType<SessionStore["getOrCreate"]>,
    input: string,
  ): UssdReply {
    const productId = session.data.menu_map?.[input];
    const underwriterId = session.data.underwriter_id;
    const product =
      underwriterId && productId
        ? findProduct(underwriterId, productId)
        : undefined;
    if (!product) {
      return this.ussd.end("Invalid selection. Please dial again.");
    }

    const data: UssdSessionData = { ...session.data, product_id: product.id };
    this.sessions.update(session.sessionId, "product_detail", data);
    return this.ussd.con(
      `${product.name}\n${product.description}\nPremium: KES ${product.premium}\n\n1. Buy now\n0. Back`,
    );
  }

  private handleProductDetail(
    session: ReturnType<SessionStore["getOrCreate"]>,
    input: string,
  ): UssdReply {
    if (input === "1") {
      this.sessions.update(session.sessionId, "enter_phone", session.data);
      return this.ussd.con("Enter M-Pesa phone number for payment:");
    }
    this.sessions.end(session.sessionId);
    return this.ussd.end("Goodbye.");
  }

  private handleEnterPhone(
    session: ReturnType<SessionStore["getOrCreate"]>,
    input: string,
  ): UssdReply {
    if (!/^0?7\d{8}$/.test(input) && !/^2547\d{8}$/.test(input)) {
      return this.ussd.con("Invalid phone number. Enter again:");
    }
    const data: UssdSessionData = { ...session.data, payment_phone: input };
    this.sessions.update(session.sessionId, "confirm_purchase", data);

    const product = findProduct(data.underwriter_id!, data.product_id!)!;
    return this.ussd.con(
      `Confirm: ${product.name} for KES ${product.premium}, paid via ${input}.\n1. Confirm\n0. Cancel`,
    );
  }

  private handleConfirmPurchase(
    session: ReturnType<SessionStore["getOrCreate"]>,
    input: string,
  ): UssdReply {
    if (input !== "1") {
      this.sessions.end(session.sessionId);
      return this.ussd.end("Purchase cancelled.");
    }
    const reference = this.finalizePurchase(session.data);
    this.sessions.end(session.sessionId);
    return this.ussd.end(
      `Purchase request received. Reference: ${reference}. You will receive an M-Pesa prompt shortly.`,
    );
  }

  /**
   * Placeholder for the real purchase pipeline (STK push + policy issuance,
   * as in cush's CoverService/PaymentController). Currently just logs and
   * returns a mock reference.
   */
  private finalizePurchase(data: UssdSessionData): string {
    const reference = `USSD-${Date.now()}`;
    console.log("[USSD] Purchase requested", { ...data, reference });
    return reference;
  }
}
