import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CompanyLogo } from "@/components/job-scout/company-logo";

afterEach(cleanup);

describe("CompanyLogo", () => {
  it("falls back to a letter tile when the URL is missing", () => {
    render(<CompanyLogo company="Linear" logoUrl={null} />);
    expect(screen.getByTestId("company-logo-fallback")).toHaveTextContent("L");
    expect(screen.queryByTestId("company-logo")).not.toBeInTheDocument();
  });

  it("renders the image when a URL is present", () => {
    render(
      <CompanyLogo
        company="Linear"
        logoUrl="https://cdn.example.com/linear.png"
      />,
    );
    expect(screen.getByTestId("company-logo")).toBeInTheDocument();
    expect(
      screen.queryByTestId("company-logo-fallback"),
    ).not.toBeInTheDocument();
  });

  it("falls back to the letter tile when the image errors", () => {
    render(
      <CompanyLogo
        company="Acme"
        logoUrl="https://cdn.example.com/broken.png"
      />,
    );
    const image = screen.getByTestId("company-logo").querySelector("img");
    expect(image).toBeTruthy();
    fireEvent.error(image!);
    expect(screen.getByTestId("company-logo-fallback")).toHaveTextContent("A");
  });

  it("retries the image when the logo URL changes after a prior error", () => {
    const { rerender } = render(
      <CompanyLogo
        company="Acme"
        logoUrl="https://cdn.example.com/broken.png"
      />,
    );
    const broken = screen.getByTestId("company-logo").querySelector("img");
    fireEvent.error(broken!);
    expect(screen.getByTestId("company-logo-fallback")).toBeInTheDocument();

    rerender(
      <CompanyLogo
        company="Linear"
        logoUrl="https://cdn.example.com/linear.png"
      />,
    );
    expect(screen.getByTestId("company-logo")).toBeInTheDocument();
    expect(
      screen.queryByTestId("company-logo-fallback"),
    ).not.toBeInTheDocument();
  });
});
