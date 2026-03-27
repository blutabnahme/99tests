import { Users } from "lucide-react";

export default function AdminUsersPage() {
  return (
    <div className="flex-1 min-w-0 w-full mb-20 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-medium text-near-black tracking-tight mb-2">User Management</h1>
        <p className="text-[15px] text-gray-500">
          Manage Doctors and Patients.
        </p>
      </div>

      <div className="bg-white rounded-[16px] border border-gray-200 p-8 text-center text-primary h-[300px] flex items-center justify-center flex-col">
        <Users className="w-12 h-12 mb-3" />
        <h2 className="font-semibold text-lg">Doctors & Patients Coming soon</h2>
      </div>
    </div>
  );
}
