import { describe, it, expect, vi } from "vitest";
import { exportToCsvAction } from "./batch.actions";

vi.mock("resend", () => {
  const Resend = vi.fn();
  Resend.prototype.emails = {
    send: vi.fn().mockResolvedValue({ id: "1" }),
  };
  return { Resend };
});

describe("Batch actions", () => {
  it("exports csv correctly", async () => {
    const res = await exportToCsvAction(["1"]);
    expect(res.success).toBe(true);
    expect(res.csv).toContain("id,name");
  });
});
