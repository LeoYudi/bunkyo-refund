import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminLayout from "./layout";

// Mock the child components to test if they are rendered by the layout
vi.mock("@/components/layout/admin-sidebar", () => ({
  AdminSidebar: () => <div data-testid="mock-admin-sidebar">Mock Sidebar</div>,
}));

vi.mock("@/components/layout/admin-header", () => ({
  AdminHeader: () => <div data-testid="mock-admin-header">Mock Header</div>,
}));

describe("AdminLayout Component", () => {
  it("deve renderizar a Sidebar, o Header e os children", () => {
    const dummyChild = <div data-testid="dummy-child">Child Content</div>;

    render(<AdminLayout>{dummyChild}</AdminLayout>);

    // Check if Sidebar is rendered
    expect(screen.getByTestId("mock-admin-sidebar")).toBeInTheDocument();

    // Check if Header is rendered
    expect(screen.getByTestId("mock-admin-header")).toBeInTheDocument();

    // Check if Children are rendered
    expect(screen.getByTestId("dummy-child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });
});
