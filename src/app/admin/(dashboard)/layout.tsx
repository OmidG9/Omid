import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'مدیریت',
};

export const dynamic = 'force-dynamic';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}