import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { PageHeader, Card, StatusBadge, Tabs, Button, useAdminData, formatDate } from '../../components/admin/adminUi';
import { adminService, type AdminReport } from '../../services/admin';

type Tab = 'open' | 'resolved';

export const AdminReportsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('open');
  const { data, loading, error, reload } = useAdminData(() => adminService.reports(tab), [tab]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (report: AdminReport, work: () => Promise<unknown>) => {
    setBusyId(report.id);
    setActionError(null);
    try {
      await work();
      await reload();
    } catch (err: any) {
      setActionError(err.message || 'Could not update this report.');
    } finally {
      setBusyId(null);
    }
  };

  const reports = data || [];

  return (
    <AdminLayout>
      <PageHeader title="Reports" description="Listings that customers have reported. Pause the listing or mark the report as resolved.">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'open', label: 'Open' },
            { value: 'resolved', label: 'Resolved' },
          ]}
        />
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 text-sm font-medium text-rose-600">{actionError}</p>}

      {error ? (
        <Card className="p-10 text-center space-y-3">
          <p className="text-sm text-slate-600">{error}</p>
          <Button onClick={reload}>Try again</Button>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-500">
          {loading ? 'Loading...' : tab === 'open' ? 'No open reports. Nothing needs checking.' : 'No resolved reports yet.'}
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const busy = busyId === r.id;
            return (
              <Card key={r.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{r.listingTitle}</p>
                    {r.listingStatus && <StatusBadge status={r.listingStatus} />}
                  </div>
                  <p className="text-sm text-slate-700 break-words">&ldquo;{r.reason}&rdquo;</p>
                  <p className="text-xs text-slate-500">
                    Reported by {r.reporter || 'a deleted account'} on {formatDate(r.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {r.listingId && r.listingStatus === 'published' && (
                    <a
                      href={`/product/${r.listingId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View listing
                    </a>
                  )}
                  {r.listingId && r.listingStatus === 'published' && (
                    <Button
                      small
                      variant="danger"
                      disabled={busy}
                      onClick={() => run(r, () => adminService.setListingStatus(r.listingId!, 'paused'))}
                    >
                      Pause listing
                    </Button>
                  )}
                  {tab === 'open' ? (
                    <Button small variant="primary" disabled={busy} onClick={() => run(r, () => adminService.setReportStatus(r.id, 'resolved'))}>
                      Mark resolved
                    </Button>
                  ) : (
                    <Button small disabled={busy} onClick={() => run(r, () => adminService.setReportStatus(r.id, 'open'))}>
                      Reopen
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
