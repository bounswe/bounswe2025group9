import { useState, useEffect } from 'react';
import { 
  Flag, 
  Warning, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye
} from '@phosphor-icons/react';
import { useLanguage } from '../../../context/LanguageContext';

interface Report {
  id: number;
  reportType: 'post' | 'user' | 'comment';
  reason: string;
  description: string;
  reportedBy: {
    id: number;
    username: string;
  };
  reportedItem: {
    id: number;
    title?: string;
    username?: string;
    content?: string;
  };
  status: 'pending' | 'acknowledged' | 'triaged' | 'resolved';
  createdAt: string;
  automated: boolean;
}

const ReportsQueue = () => {
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiClient.moderation.getReports({ status: filterStatus });
      // setReports(response.results);
      
      // Mock data for now
      setReports([
        {
          id: 1,
          reportType: 'post',
          reason: 'Spam',
          description: 'This post contains promotional content unrelated to nutrition',
          reportedBy: { id: 10, username: 'user123' },
          reportedItem: { 
            id: 45, 
            title: 'Best supplements for weight loss!',
            content: 'Lorem ipsum...'
          },
          status: 'pending',
          createdAt: '2025-11-09T10:30:00Z',
          automated: false
        },
        {
          id: 2,
          reportType: 'post',
          reason: 'Misinformation',
          description: 'Contains false health claims',
          reportedBy: { id: 11, username: 'healthwatcher' },
          reportedItem: { 
            id: 46, 
            title: 'Cure diabetes with this one weird trick',
            content: 'Lorem ipsum...'
          },
          status: 'acknowledged',
          createdAt: '2025-11-09T09:15:00Z',
          automated: true
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: number, action: 'approve' | 'warn' | 'remove' | 'ban' | 'dismiss') => {
    try {
      // TODO: Replace with actual API call
      // await apiClient.moderation.takeAction(reportId, action);
      console.log(`Taking action "${action}" on report ${reportId}`);
      
      // Refresh reports
      fetchReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Failed to take action:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      acknowledged: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Eye },
      triaged: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Warning },
      resolved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle }
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {['all', 'pending', 'acknowledged', 'triaged', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
              style={{
                backgroundColor: filterStatus === status
                  ? 'var(--forum-default-active-bg)'
                  : 'var(--forum-default-bg)',
                color: filterStatus === status
                  ? 'var(--forum-default-active-text)'
                  : 'var(--forum-default-text)'
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Flag size={48} className="mx-auto mb-4 opacity-50" />
            <p>{t('admin.noReportsFound')}</p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Flag size={24} className="text-red-500" weight={report.automated ? 'fill' : 'regular'} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {report.reportedItem.title || report.reportedItem.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('admin.reportedBy')}: {report.reportedBy.username}
                      {report.automated && <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">({t('admin.automated')})</span>}
                    </p>
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('admin.reason')}:</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{report.reason}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t('admin.reportedOn')}: {new Date(report.createdAt).toLocaleString()}
                </div>
              </div>

              {selectedReport?.id === report.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(report.id, 'approve'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={16} />
                      {t('admin.approveDismiss')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(report.id, 'warn'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors"
                    >
                      <Warning size={16} />
                      {t('admin.warnUser')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(report.id, 'remove'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                    >
                      <XCircle size={16} />
                      {t('admin.removeContent')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(report.id, 'ban'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={16} weight="fill" />
                      {t('admin.banUser')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsQueue;
