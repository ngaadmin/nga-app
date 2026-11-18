import type React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CredentialForm } from "@/components/ui/credential-form";
import { useHydrated } from "@/lib/ui/use-hydrated";

function Probe() {
  const hydrated = useHydrated();
  return (
    <CredentialForm>
      <input name="password" type="password" />
      <button type="submit" disabled={!hydrated}>
        Go
      </button>
    </CredentialForm>
  );
}

describe("CredentialForm", () => {
  it("renders method=post so a pre-hydration submit cannot be a GET", () => {
    const html = renderToString(<Probe />);
    expect(html).toContain('method="post"');
  });

  it("keeps submit disabled in server HTML until hydrated", () => {
    const html = renderToString(<Probe />);
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it("cannot be switched back to GET by a caller", () => {
    const Props = CredentialForm as unknown as (p: Record<string, unknown>) => React.ReactElement;
    const html = renderToString(<Props method="get" />);
    expect(html).toContain('method="post"');
    expect(html).not.toContain('method="get"');
  });
});
