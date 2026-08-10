/**
 * Root admin layout — intentionally minimal. The full shell (sidebar/topbar)
 * lives in the (dashboard) route group so the login page renders standalone.
 * Auth is enforced by middleware before any admin route renders.
 */

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}