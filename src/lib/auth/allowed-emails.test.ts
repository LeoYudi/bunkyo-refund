import { describe, expect, it } from "vitest";
import { isAllowedAdminEmail } from "./allowed-emails";

describe("isAllowedAdminEmail", () => {
  describe("authorized emails", () => {
    it("should allow standard @bunkyo.org.br emails", () => {
      expect(isAllowedAdminEmail("admin@bunkyo.org.br")).toBe(true);
      expect(isAllowedAdminEmail("jovens@bunkyo.org.br")).toBe(true);
      expect(isAllowedAdminEmail("Nome.Sobrenome+tag@bunkyo.org.br")).toBe(
        true,
      );
    });

    it("should allow @bunkyo.org.br emails regardless of letter casing", () => {
      expect(isAllowedAdminEmail("USER@BUNKYO.ORG.BR")).toBe(true);
      expect(isAllowedAdminEmail("Admin@Bunkyo.Org.Br")).toBe(true);
    });

    it("should allow @bunkyo.org.br emails with leading or trailing whitespace", () => {
      expect(isAllowedAdminEmail(" admin@bunkyo.org.br ")).toBe(true);
      expect(isAllowedAdminEmail("\tjovens@bunkyo.org.br\n")).toBe(true);
    });

    it("should allow the explicit exception lyhiguti@gmail.com case-insensitively and trimmed", () => {
      expect(isAllowedAdminEmail("lyhiguti@gmail.com")).toBe(true);
      expect(isAllowedAdminEmail("LYHIGUTI@GMAIL.COM")).toBe(true);
      expect(isAllowedAdminEmail(" lyhiguti@gmail.com ")).toBe(true);
    });
  });

  describe("unauthorized emails and bypass attempts", () => {
    it("should reject other @gmail.com and external domain emails", () => {
      expect(isAllowedAdminEmail("outro@gmail.com")).toBe(false);
      expect(isAllowedAdminEmail("lyhiguti+alias@gmail.com")).toBe(false);
      expect(isAllowedAdminEmail("user@example.com")).toBe(false);
    });

    it("should reject domain suffix, subdomain, and multiple-@ bypass attempts", () => {
      expect(isAllowedAdminEmail("evil@fakebunkyo.org.br")).toBe(false);
      expect(isAllowedAdminEmail("evil@sub.bunkyo.org.br")).toBe(false);
      expect(isAllowedAdminEmail("user@bunkyo.org.br.evil.com")).toBe(false);
      expect(isAllowedAdminEmail("lyhiguti@gmail.com.evil.com")).toBe(false);
      expect(isAllowedAdminEmail("attacker@evil.com@bunkyo.org.br")).toBe(
        false,
      );
      expect(isAllowedAdminEmail("user name@bunkyo.org.br")).toBe(false);
    });

    it("should reject missing local part, empty strings, null, and undefined", () => {
      expect(isAllowedAdminEmail("@bunkyo.org.br")).toBe(false);
      expect(isAllowedAdminEmail("   @bunkyo.org.br")).toBe(false);
      expect(isAllowedAdminEmail("")).toBe(false);
      expect(isAllowedAdminEmail("   ")).toBe(false);
      expect(isAllowedAdminEmail(null)).toBe(false);
      expect(isAllowedAdminEmail(undefined)).toBe(false);
    });
  });
});
