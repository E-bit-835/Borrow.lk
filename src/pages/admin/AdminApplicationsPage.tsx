import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, Badge, Tabs, Button, useAdminData } from '../../components/admin/adminUi';
import { adminService, type PartnerApplication } from '../../services/admin';
import type { PartnerStatus } from '../../services/auth';

type Tab = 'pending' | 'approved' | 'rejected';

/** Readable "Label: value" pairs from whatever the applicant submitted. */
function details(app: PartnerApplication): Array<[string, string]> {
  const a = app.application || {};
  const rows: Array<[string, any]> =
    app.capability === 'HOST'
      ? [['Host type', a.hostType], ['Will rent out', (a.categories || []).join(', ')], ['About', a.about], ['NIC', a.nicNumber]]
      : [['Service', a.serviceCategory], ['Description', a.description], ['Experience', a.experience], ['NIC', a.nicNumber]];
  return rows.filter(([, v]) => v).map(([k, v]) => [k, String(v)]);
}

export const AdminApplicationsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pending');
  const { data, loading, error, reload } = useAdminData(() => adminService.applications(tab), [tab]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const decide = async (app: PartnerApplication, status: PartnerStatus) => {
    const key = `${app.user.id}:${app.capability}`;
    setBusyKey(key);
    setActionError(null);
    try {
      await adminService.setCapability(app.user.id, app.capability, status);
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this application.');
    } finally {
      setBusyKey(null);
    }
  };

  const apps = data || [];

  return (
    <AdminLayout>
      <PageHeader
        title="Applications"
        description="People asking to become a Host (rent out items) or a Provider (offer services)."
      >
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : apps.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          {loading ? 'Loading...' : tab === 'pending' ? 'No applications are waiting for review.' : `No ${tab} applications.`}
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {apps.map((app) => {
            const key = `${app.user.id}:${app.capability}`;
            const busy = busyKey === key;
            return (
              <Card key={key} className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <img src={app.user.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{app.user.name}</p>
                      <Badge tone={app.capability === 'HOST' ? 'blue' : 'purple'}>
                        {app.capability === 'HOST' ? 'Host' : 'Provider'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {[app.user.email, app.user.phone, app.user.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>

                {details(app).length > 0 && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm bg-slate-50 rounded-xl p-3.5">
                    {details(app).map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                        <dd className="text-slate-700 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="flex justify-end gap-2 mt-auto">
                  {tab !== 'rejected' && (
                    <Button variant="danger" small disabled={busy} onClick={() => decide(app, 'rejected')}>
                      {tab === 'approved' ? 'Revoke' : 'Reject'}
                    </Button>
                  )}
                  {tab !== 'approved' && (
                    <Button variant="success" small disabled={busy} onClick={() => decide(app, 'approved')}>
                      Approve
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};
