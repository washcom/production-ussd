export interface UssdIncoming {
  sessionId: string;
  phone: string;
  serviceCode: string;
  /** Full `*`-joined chain as sent by the gateway. */
  text: string;
  /** The latest segment the user entered (empty string on the first dial). */
  input: string;
}

export type UssdReplyType = "CON" | "END";

export interface UssdReply {
  type: UssdReplyType;
  body: string;
}

export type UssdStep =
  | "main_menu"
  | "select_underwriter"
  | "select_product"
  | "product_detail"
  | "enter_phone"
  | "confirm_purchase"
  | "completed";

export interface UssdSessionData {
  underwriter_id?: string;
  product_id?: string;
  payment_phone?: string;
  /** Maps the number the user typed on the current menu to the id it represents. */
  menu_map?: Record<string, string>;
}

export interface UssdSession {
  sessionId: string;
  phone: string;
  step: UssdStep;
  data: UssdSessionData;
  createdAt: number;
  updatedAt: number;
}
