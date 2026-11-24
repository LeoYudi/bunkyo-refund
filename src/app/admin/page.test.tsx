import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRefundRequestsAction } from "@/actions/refund.actions";
import {
  RequestsTable,
  type RequestsTableProps,
} from "@/components/ui/requests-table";
import { createClient } from "@/lib/supabase/server";
import type { RefundRequest } from "@/models/refund.model";
import AdminDashboardPage from "./page";

vi.mock("@/actions/refund.actions", () => ({
  getRefundRequestsAction: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/components/ui/status-lifecycle", () => ({
  StatusLifecycle: () => (
    <div data-testid="mock-status-lifecycle">Mock StatusLifecycle</div>
  ),
}));

vi.mock("@/components/ui/requests-table", () => ({
  RequestsTable: vi.fn((props: RequestsTableProps) => (
    <div
      data-testid="mock-requests-table"
      data-can-send-batch-email={String(props.canSendBatchEmail)}
    >
      Mock RequestsTable
    </div>
  )),
}));

describe("AdminDashboardPage", () => {
  const mockRequests: RefundRequest[] = [
    {
      id: "req-1",
      requester_name: "Alice Silva",
      status: "APPROVED",
      created_at: "2026-10-01T10:00:00Z",
      updated_at: "2026-10-01T10:00:00Z",
      description: "Almoço da equipe",
      issue_date: "2026-10-01",
      issue_number: "NF-100",
      issuer_cnpj: "12.345.678/0001-90",
      issuer_name: "Restaurante Sabor",
      receipt_file_url: "https://example.com/receipt1.pdf",
      receiver_cnpj: null,
      reviewed_by: "admin-1",
      total_value: 150.5,
    },
  ];

  const mockGetSession = vi.fn();

  const mockAuthSession = (
    session: { provider_token?: string | null } | null,
  ) => {
    mockGetSession.mockResolvedValue({
      data: { session },
      error: null,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getRefundRequestsAction).mockResolvedValue({
      success: true,
      data: mockRequests,
    });

    mockAuthSession(null);

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getSession: mockGetSession,
      },
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("should pass canSendBatchEmail={false} to RequestsTable when session has provider_token: null", async () => {
    mockAuthSession({ provider_token: null });

    render(await AdminDashboardPage());

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(RequestsTable).toHaveBeenCalledTimes(1);
    expect(vi.mocked(RequestsTable).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        requests: mockRequests,
        canSendBatchEmail: false,
      }),
    );
    expect(screen.getByTestId("mock-requests-table")).toHaveAttribute(
      "data-can-send-batch-email",
      "false",
    );
  });

  it("should pass canSendBatchEmail={false} to RequestsTable when session is null", async () => {
    mockAuthSession(null);

    render(await AdminDashboardPage());

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(RequestsTable).toHaveBeenCalledTimes(1);
    expect(vi.mocked(RequestsTable).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        requests: mockRequests,
        canSendBatchEmail: false,
      }),
    );
    expect(screen.getByTestId("mock-requests-table")).toHaveAttribute(
      "data-can-send-batch-email",
      "false",
    );
  });

  it("should pass canSendBatchEmail={false} to RequestsTable when session has empty provider_token", async () => {
    mockAuthSession({ provider_token: "" });

    render(await AdminDashboardPage());

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(RequestsTable).toHaveBeenCalledTimes(1);
    expect(vi.mocked(RequestsTable).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        requests: mockRequests,
        canSendBatchEmail: false,
      }),
    );
  });

  it("should pass canSendBatchEmail={true} to RequestsTable when session has a valid Google OAuth provider_token", async () => {
    mockAuthSession({ provider_token: "ya29.valid-google-token" });

    render(await AdminDashboardPage());

    expect(mockGetSession).toHaveBeenCalledTimes(1);
    expect(RequestsTable).toHaveBeenCalledTimes(1);
    expect(vi.mocked(RequestsTable).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        requests: mockRequests,
        canSendBatchEmail: true,
      }),
    );
    expect(screen.getByTestId("mock-requests-table")).toHaveAttribute(
      "data-can-send-batch-email",
      "true",
    );
  });

  it("should render error message when getRefundRequestsAction fails", async () => {
    vi.mocked(getRefundRequestsAction).mockResolvedValue({
      success: false,
      error: "Erro ao consultar banco",
    });

    render(await AdminDashboardPage());

    expect(
      screen.getByText(
        /Erro ao carregar solicitações: Erro ao consultar banco/i,
      ),
    ).toBeInTheDocument();
    expect(RequestsTable).not.toHaveBeenCalled();
  });
});
