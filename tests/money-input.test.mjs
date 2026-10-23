import test from "node:test";
import assert from "node:assert/strict";
import {
  readAmount,
  formatAmount,
  formatAmountInput,
  normalizePastedAmount,
} from "../web/money-input.js";

test("los montos agrupan miles sin alterar centavos ni cifras grandes", () => {
  for (const [canonical, display] of [
    ["1000000", "1.000.000,00"],
    ["1250000.50", "1.250.000,50"],
    ["250000.05", "250.000,05"],
    ["123456789012345.67", "123.456.789.012.345,67"],
  ]) {
    assert.equal(formatAmount(canonical), display);
    assert.equal(
      readAmount(display).canonical,
      canonical.includes(".") ? canonical : canonical + ".00",
    );
  }
  assert.equal(formatAmount(""), "");
});
test("la escritura conserva coma pendiente, ceros decimales y posición del cursor", () => {
  assert.deepEqual(formatAmountInput("1234", 4), {
    ...readAmount("1234"),
    formatted: "1.234",
    caret: 5,
  });
  assert.equal(formatAmountInput("1234,", 5).formatted, "1.234,");
  assert.equal(formatAmountInput("1234,50", 7).formatted, "1.234,50");
  const middle = formatAmountInput("12.934.567,89", 4);
  assert.equal(middle.caret, 4);
  assert.equal(middle.canonical, "12934567.89");
  assert.equal(formatAmountInput(",", 1).formatted, "0,");
  assert.equal(formatAmountInput(",", 1).caret, 2);
  assert.equal(formatAmountInput("0001234", 7).formatted, "1.234");
});
test("pegar COP/USD en notación colombiana o estadounidense mantiene el mismo monto", () => {
  for (const value of [
    "COP $ 1.234.567,89",
    "USD 1,234,567.89",
    "$1234567.89",
    "1234567,89",
  ])
    assert.equal(normalizePastedAmount(value), "1.234.567,89");
  assert.equal(normalizePastedAmount("1.234.567"), "1.234.567");
  assert.equal(normalizePastedAmount("1,234,567"), "1.234.567");
  assert.equal(normalizePastedAmount("USD 5000.50"), "5.000,50");
});
test("no convierte importes negativos, texto, exponentes o decimales excesivos en otro monto", () => {
  for (const value of [
    "-1000",
    "1e6",
    "no es dinero",
    "1,2345",
    "1234567890123456",
  ])
    assert.equal(readAmount(value).valid, false);
  for (const value of ["-1000", "1e6", "1.2.3", "1,2345", "123,456", ""])
    assert.equal(normalizePastedAmount(value), null);
});
