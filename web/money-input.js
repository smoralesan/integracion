// The editable representation uses es-CO separators; stored amounts use a decimal point.
// Keep decimal strings so adding thousands separators never rounds the entered amount.
export function readAmount(value) {
  const text = String(value ?? "");
  if (!text)
    return {
      valid: true,
      canonical: "",
      integer: "",
      fraction: "",
      decimal: false,
    };
  if (!/^[\d.]*,?\d*$/.test(text)) return { valid: false };
  const [whole, fraction = ""] = text.split(",");
  const digits = whole.replaceAll(".", "");
  if (!digits && !text.includes(",")) return { valid: false };
  const integer = digits.replace(/^0+(?=\d)/, "") || "0";
  if (integer.length > 15 || fraction.length > 2) return { valid: false };
  const decimal = text.includes(",");
  return {
    valid: true,
    integer,
    fraction,
    decimal,
    canonical: integer + (fraction ? "." + fraction : ""),
  };
}
const group = (integer) => integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function formatAmount(value, { padDecimals = true } = {}) {
  if (value === "" || value == null) return "";
  const text = String(value);
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return "";
  const [whole, fraction = ""] = text.split(".");
  const integer = whole.replace(/^0+(?=\d)/, "");
  return (
    group(integer) +
    (padDecimals
      ? "," + fraction.padEnd(2, "0")
      : fraction
        ? "," + fraction
        : "")
  );
}

export function formatAmountInput(value, caret = String(value).length) {
  const text = String(value),
    parsed = readAmount(text);
  if (!parsed.valid || !text) return { ...parsed, formatted: text, caret };
  const formatted =
    group(parsed.integer) + (parsed.decimal ? "," + parsed.fraction : "");
  const removedZeroes =
    text.split(",")[0].replaceAll(".", "").length - parsed.integer.length;
  const insertedZero =
    !text.split(",")[0].replaceAll(".", "").length && parsed.decimal ? 1 : 0;
  const logicalCaret = Math.max(
    0,
    text.slice(0, caret).replaceAll(".", "").length -
      Math.max(0, removedZeroes) +
      insertedZero,
  );
  let position = 0,
    counted = 0;
  while (position < formatted.length && counted < logicalCaret) {
    if (formatted[position] !== ".") counted++;
    position++;
  }
  return { ...parsed, formatted, caret: position };
}

// Accept copied amounts in Colombian or US notation, including COP/USD/$ prefixes.
export function normalizePastedAmount(value) {
  let text = String(value)
    .trim()
    .replace(/(?:COP|USD)/gi, "")
    .replace(/[$\s]/g, "");
  if (!text || !/^[\d.,]+$/.test(text)) return null;
  if (text.includes(".") && text.includes(",")) {
    if (text.lastIndexOf(".") > text.lastIndexOf(",")) {
      if (!/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/.test(text)) return null;
      text = text.replaceAll(",", "").replace(".", ",");
    } else {
      if (!/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/.test(text)) return null;
    }
  } else if (text.includes(".")) {
    if (/^\d{1,3}(?:\.\d{3})+$/.test(text)) text = text.replaceAll(".", "");
    else if (/^\d+\.\d{1,2}$/.test(text)) text = text.replace(".", ",");
    else return null;
  } else if (text.includes(",") && !/^\d+,\d{1,2}$/.test(text)) {
    if (/^\d{1,3}(?:,\d{3}){2,}$/.test(text)) text = text.replaceAll(",", "");
    else return null;
  }
  const result = formatAmountInput(text);
  return result.valid ? result.formatted : null;
}
