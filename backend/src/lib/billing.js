import { Prisma } from "@prisma/client";

export function parseBudgetRange(range) {
  if (!range) {
    return 0;
  }

  const text = String(range);
  if (text.includes("25,000+")) return 25000;

  const match = text.match(/\$([\d,]+)(?:\s*-\s*\$?([\d,]+))?/);
  if (!match) {
    return 0;
  }

  const first = Number.parseInt(match[1].replace(/,/g, ""), 10);
  const second = match[2] ? Number.parseInt(match[2].replace(/,/g, ""), 10) : first;
  return Math.round((first + second) / 2);
}

export function money(value) {
  return new Prisma.Decimal(value ?? 0).toFixed(2);
}

export function toNumber(decimalValue) {
  if (decimalValue == null) {
    return 0;
  }

  return typeof decimalValue === "number" ? decimalValue : Number(decimalValue.toString());
}

export function formatInvoiceLabel(index) {
  return `INV-${2000 + index}`;
}