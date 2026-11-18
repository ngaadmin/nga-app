import type { ComponentPropsWithoutRef } from "react";

/**
 * Form for anything that carries a password, PIN or similar secret.
 *
 * `method="post"` is fixed on purpose. If a person submits before the page has
 * hydrated, the browser does a native submit. With the default GET that would
 * put every named field in the URL, browser history and server logs. A POST
 * keeps fields in the request body. Pair this with `useHydrated()` to keep the
 * submit button disabled until the React handler is attached.
 */
export type CredentialFormProps = Omit<ComponentPropsWithoutRef<"form">, "method">;

export function CredentialForm(props: CredentialFormProps) {
  return <form {...props} method="post" />;
}
