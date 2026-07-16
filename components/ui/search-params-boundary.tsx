import { Suspense, type ReactNode } from "react";

type SearchParamsBoundaryProps = {
  children: ReactNode;
  /** Optional loading UI while search params hydrate on the client. */
  fallback?: ReactNode;
};

/**
 * Required wrapper for client components that call `useSearchParams()`.
 * Prevents Next.js App Router CSR bailout / prerender build failures.
 */
export function SearchParamsBoundary({
  children,
  fallback = null,
}: SearchParamsBoundaryProps) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
