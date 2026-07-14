import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginPage } from "../../src/components/auth/LoginPage";

// Create mocks prefixed with 'mock' so Vitest allows reference in hoisting
const mockLogin = vi.fn();
const mockShowNotification = vi.fn();

// Mock the Auth Context
vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// Mock the Notifications Context
vi.mock("../../src/components/ui/Notifications", () => ({
  useNotifications: () => ({
    showNotification: mockShowNotification,
  }),
}));

describe("LoginPage Component Unit Tests", () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render staff authentication login form fields correctly", () => {
    render(<LoginPage onNavigate={mockOnNavigate} />);

    // Verify branded elements are present
    expect(screen.getByText(/Celcom Networks/i)).toBeDefined();
    expect(screen.getByText(/Staff Authentication/i)).toBeDefined();

    // Verify inputs and submit button are rendered
    expect(screen.getByLabelText(/Corporate Email Address/i)).toBeDefined();
    expect(screen.getByLabelText(/Security Password/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Establish Access Node/i })).toBeDefined();
  });

  it("should display error message on authentication failure with incorrect credentials", async () => {
    // Configure mock login to return failure message
    mockLogin.mockResolvedValue({ success: false, message: "Invalid cryptographic signature or key." });

    render(<LoginPage onNavigate={mockOnNavigate} />);

    const emailInput = screen.getByLabelText(/Corporate Email Address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Security Password/i) as HTMLInputElement;
    const submitBtn = screen.getByRole("button", { name: /Establish Access Node/i });

    // Populate inputs to bypass native HTML5 validation
    fireEvent.change(emailInput, { target: { value: "noc@celcomnetworks.co.ke" } });
    fireEvent.change(passwordInput, { target: { value: "incorrect-pass" } });

    fireEvent.click(submitBtn);

    // Verify error boundary message is rendered in UI
    await waitFor(() => {
      expect(screen.getByText(/Invalid cryptographic signature or key/i)).toBeDefined();
    });
  });

  it("should trigger staff login success and dispatch notification", async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(<LoginPage onNavigate={mockOnNavigate} />);

    const emailInput = screen.getByLabelText(/Corporate Email Address/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/Security Password/i) as HTMLInputElement;
    const submitBtn = screen.getByRole("button", { name: /Establish Access Node/i });

    fireEvent.change(emailInput, { target: { value: "admin@celcomnetworks.co.ke" } });
    fireEvent.change(passwordInput, { target: { value: "AdminSecurePassword2026!" } });

    fireEvent.click(submitBtn);

    // Form should submit successfully
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@celcomnetworks.co.ke", "AdminSecurePassword2026!");
      expect(mockShowNotification).toHaveBeenCalledWith(
        "Welcome Back",
        "Security access granted. Initiating ERP sync...",
        "success"
      );
    });
  });
});
