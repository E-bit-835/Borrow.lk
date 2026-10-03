import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  PageHeader, DataTable, Td, Badge, SearchInput, Select, Button, ConfirmDialog, useAdminData, useDebounced, formatDate,
} from '../../components/admin/adminUi';
import { adminService, type AdminUser } from '../../services/admin';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All accounts' },
  { value: 'renter', label: 'Customers' },
  { value: 'host', label: 'Hosts' },
  { value: 'provider', label: 'Providers' },
  { value: 'admin', label: 'Admins' },
  { value: 'suspended', label: 'Suspended' },
];

export const AdminUsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useAdminData(() => adminService.users({ search: q, role }), [q, role]);

  const [target, setTarget] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirm = async () => {
    if (!target) return;
    setBusy(true);
    setActionError(null);
    try {
      await adminService.setSuspended(target.id, !target.suspended);
      setTarget(null);
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this account.');
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const users = data || [];

  return (
    <AdminLayout>
      <PageHeader title="Users" description="Every account on BorrowLK. Suspend an account to block its login and activity.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or phone" />
        <Select value={role} onChange={setRole} label="Account type" options={ROLE_OPTIONS} />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      <DataTable
        columns={['User', 'Type', 'Listings', 'Joined', 'Status', '']}
        loading={loading}
        error={error}
        isEmpty={users.length === 0}
        emptyText="No users match your search."
        onRetry={reload}
      >
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-slate-50/60">
            <Td>
              <div className="flex items-center gap-3 min-w-[200px]">
                <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
              </div>
            </Td>
            <Td>
              <div className="flex flex-wrap gap-1">
                {u.role === 'admin' ? (
                  <Badge tone="purple">Admin</Badge>
                ) : (
                  <>
                    <Badge>Customer</Badge>
                    {u.capabilities?.includes('HOST') && <Badge tone="blue">Host</Badge>}
                    {u.capabilities?.includes('PROVIDER') && <Badge tone="purple">Provider</Badge>}
                  </>
                )}
              </div>
            </Td>
            <Td className="tabular-nums text-slate-600">{u.listingsCount}</Td>
            <Td className="text-slate-600 whitespace-nowrap">{u.createdAt ? formatDate(u.createdAt) : '–'}</Td>
            <Td>{u.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}</Td>
            <Td className="text-right">
              {u.id !== me?.id && (
                <Button small variant={u.suspended ? 'ghost' : 'danger'} onClick={() => setTarget(u)}>
                  {u.suspended ? 'Reactivate' : 'Suspend'}
                </Button>
              )}
            </Td>
          </tr>
        ))}
      </DataTable>

      {target && (
        <ConfirmDialog
          title={target.suspended ? 'Reactivate this account?' : 'Suspend this account?'}
          message={
            target.suspended
              ? `${target.name} will be able to log in and use BorrowLK again.`
              : `${target.name} will not be able to log in, publish listings or send requests until reactivated.`
          }
          confirmLabel={target.suspended ? 'Reactivate' : 'Suspend'}
          danger={!target.suspended}
          busy={busy}
          onConfirm={confirm}
          onCancel={() => setTarget(null)}
        />
      )}
    </AdminLayout>
  );
};
