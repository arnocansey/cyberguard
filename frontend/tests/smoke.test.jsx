import { render, screen } from "@testing-library/react";

function Sample() {
  return <div>CyberGuard Frontend Test</div>;
}

describe("frontend smoke", () => {
  it("renders sample", () => {
    render(<Sample />);
    expect(screen.getByText("CyberGuard Frontend Test")).toBeTruthy();
  });
});
