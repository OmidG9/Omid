import AdminShell from '@/components/admin/AdminShell';
import { getStore } from '@/lib/db';
import { CONTACT_STATUS } from '@/types/contacts';

export const metadata = {
  title: 'مدیریت',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let newRequests = 0;
  try {
    const { total } = await getStore().listContacts({
      page: 1,
      pageSize: 1,
      status: CONTACT_STATUS.NEW,
    });
    newRequests = total;
  } catch {
    // Store outage shouldn't take the whole dashboard down (§74).
    newRequests = 0;
  }
  return <AdminShell newRequests={newRequests}>{children}</AdminShell>;
}