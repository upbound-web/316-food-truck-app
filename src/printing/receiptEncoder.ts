/**
 * Builds ESC/POS byte arrays for thermal receipt printing.
 * Targets 42-char width (standard 80mm thermal paper).
 */

const ESC = 0x1b;
const GS = 0x1d;
const LINE_WIDTH = 42;

// ESC/POS command sequences
const INIT = new Uint8Array([ESC, 0x40]); // Initialize printer
const BOLD_ON = new Uint8Array([ESC, 0x45, 0x01]);
const BOLD_OFF = new Uint8Array([ESC, 0x45, 0x00]);
const ALIGN_CENTER = new Uint8Array([ESC, 0x61, 0x01]);
const ALIGN_LEFT = new Uint8Array([ESC, 0x61, 0x00]);
const DOUBLE_HEIGHT_ON = new Uint8Array([ESC, 0x21, 0x10]); // Double height
const DOUBLE_WIDTH_ON = new Uint8Array([ESC, 0x21, 0x20]); // Double width
const DOUBLE_SIZE_ON = new Uint8Array([ESC, 0x21, 0x30]); // Double width + height
const NORMAL_SIZE = new Uint8Array([ESC, 0x21, 0x00]);
const CUT = new Uint8Array([GS, 0x56, 0x00]); // Full cut
const FEED_LINES = (n: number) => new Uint8Array([ESC, 0x64, n]);

const encoder = new TextEncoder();

function text(str: string): Uint8Array {
  return encoder.encode(str);
}

function line(str: string): Uint8Array {
  return text(str + "\n");
}

function dashes(): Uint8Array {
  return line("-".repeat(LINE_WIDTH));
}

function padRight(str: string, width: number): string {
  return str.length >= width ? str.slice(0, width) : str + " ".repeat(width - str.length);
}

function padLeft(str: string, width: number): string {
  return str.length >= width ? str.slice(0, width) : " ".repeat(width - str.length) + str;
}

function twoColumn(left: string, right: string): string {
  const rightWidth = right.length;
  const leftWidth = LINE_WIDTH - rightWidth - 1;
  return padRight(left, leftWidth) + " " + padLeft(right, rightWidth);
}

export interface ReceiptOrderItem {
  quantity: number;
  size: string;
  customizations: string[];
  itemPrice: number;
  menuItem?: { name: string } | null;
}

export interface ReceiptOrder {
  orderNumber: number;
  customerName: string;
  _creationTime: number;
  items: ReceiptOrderItem[];
  totalAmount: number;
}

export function encodeReceipt(order: ReceiptOrder): Uint8Array {
  const parts: Uint8Array[] = [];

  const push = (...arrays: Uint8Array[]) => {
    parts.push(...arrays);
  };

  // Initialize
  push(INIT);

  // Order number — large and bold, centered
  push(ALIGN_CENTER, BOLD_ON, DOUBLE_SIZE_ON);
  push(line(`ORDER #${order.orderNumber}`));
  push(NORMAL_SIZE, BOLD_OFF);

  // Customer name
  push(BOLD_ON);
  push(line(order.customerName));
  push(BOLD_OFF);

  // Timestamp
  const date = new Date(order._creationTime);
  const timeStr = date.toLocaleString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: true,
  });
  push(line(timeStr));
  push(ALIGN_LEFT);
  push(dashes());

  // Items
  for (const item of order.items) {
    const name = item.menuItem?.name ?? "Unknown Item";
    const qty = item.quantity;
    const lineTotal = (item.itemPrice * qty).toFixed(2);
    const priceStr = `$${lineTotal}`;

    // Item line: "2x Flat White (Large)          $9.00"
    const itemLabel = `${qty}x ${name} (${item.size})`;
    push(line(twoColumn(itemLabel, priceStr)));

    // Customizations indented
    if (item.customizations.length > 0) {
      push(line(`   + ${item.customizations.join(", ")}`));
    }
  }

  // Total
  push(dashes());
  push(BOLD_ON);
  push(line(twoColumn("TOTAL", `$${order.totalAmount.toFixed(2)}`)));
  push(BOLD_OFF);
  push(dashes());

  // Feed and cut
  push(FEED_LINES(4));
  push(CUT);

  // Merge all parts into a single Uint8Array
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
