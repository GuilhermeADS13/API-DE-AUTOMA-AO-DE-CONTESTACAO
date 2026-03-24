// Testes unitarios das funcoes de validacao utilizadas pelo frontend.
import { describe, expect, it } from "vitest";

import {
  getPasswordChecks,
  isValidEmail,
  isValidNumeroProcesso,
  validateAuthField,
} from "./validators";

// Suite de testes das regras de validacao usadas no frontend.
describe("validators", () => {
  it("valida email basico", () => {
    expect(isValidEmail("contato@escritorio.com")).toBe(true);
    expect(isValidEmail("email-invalido")).toBe(false);
  });

  it("valida numero CNJ", () => {
    expect(isValidNumeroProcesso("0001234-56.2026.8.00.0000")).toBe(true);
    expect(isValidNumeroProcesso("123")).toBe(false);
  });

  it("aplica regras de senha para signup", () => {
    const checks = getPasswordChecks("Senha@123");
    expect(checks.minLength).toBe(true);
    expect(checks.hasUppercase).toBe(true);
    expect(checks.hasLowercase).toBe(true);
    expect(checks.hasNumber).toBe(true);
    expect(checks.hasSymbol).toBe(true);
  });

  it("retorna mensagem quando senha fraca no cadastro", () => {
    const message = validateAuthField("password", "fraca", "signup");
    expect(typeof message).toBe("string");
    expect(message.length).toBeGreaterThan(0);
  });
});
