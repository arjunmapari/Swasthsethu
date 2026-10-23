import { AdminUsers } from "@/components/doctor/AdminUsers";
import { requireAdmin } from "@/server/guards";
import { listStaffAndPatients } from "@/server/users";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await requireAdmin("/admin");
  const users = await listStaffAndPatients();
  return (
    <div>
      <h1 className="mb-5 font-display text-2xl">Accounts</h1>
      <AdminUsers users={users} meId={me.id} />
    </div>
  );
}
