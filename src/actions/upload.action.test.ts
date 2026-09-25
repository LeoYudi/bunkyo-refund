import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { uploadReceipt } from "./upload.action";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("uploadReceipt Server Action", () => {
  let mockUpload: ReturnType<typeof vi.fn>;
  let mockGetPublicUrl: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpload = vi.fn();
    mockGetPublicUrl = vi.fn();
    mockFrom = vi.fn(() => ({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    }));

    vi.mocked(createClient).mockResolvedValue({
      storage: {
        from: mockFrom,
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should successfully upload a file and return its public URL", async () => {
    const mockFile = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.append("file", mockFile);

    mockUpload.mockResolvedValue({
      data: { path: "unique-id.png" },
      error: null,
    });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://mock-url.com/unique-id.png" },
    });

    const result = await uploadReceipt(formData);

    expect(result).toBe("https://mock-url.com/unique-id.png");
    expect(createClient).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("receipts");
    const uploadCallArgs = mockUpload.mock.calls[0];
    expect(uploadCallArgs[0]).toMatch(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.png$/,
    );
    expect(uploadCallArgs[1]).toBe(mockFile);
    expect(mockGetPublicUrl).toHaveBeenCalled();
  });

  it("should throw an error if the upload fails", async () => {
    const mockFile = new File(["dummy content"], "receipt.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.append("file", mockFile);

    mockUpload.mockResolvedValue({
      data: null,
      error: new Error("Upload failed"),
    });

    await expect(uploadReceipt(formData)).rejects.toThrow("Upload failed");
  });

  it("should throw an error if no file is provided", async () => {
    const formData = new FormData();

    await expect(uploadReceipt(formData)).rejects.toThrow("No file provided");
  });

  it("should throw an error if the provided file is not a File object", async () => {
    const formData = new FormData();
    formData.append("file", "just a string");

    await expect(uploadReceipt(formData)).rejects.toThrow("No file provided");
  });
});
