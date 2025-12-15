import { useState, useEffect } from 'react';
import { ChartBar, TrendUp, TrendDown, Users, Article, Flag, ForkKnife } from '@phosphor-icons/react';
import { apiClient } from '../../../lib/apiClient';
import { useLanguage } from '../../../context/LanguageContext';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  resolvedReports: number;
  pendingFoodProposals: number;
  approvedFoodProposals: number;
  pendingCertificates: number;
  verifiedCertificates: number;
  moderationActionsThisWeek: number;
}

interface Trend {
  value: number;
  change: number;
  isPositive: boolean;
}

const ModerationStats = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiClient.moderation.getStats(timeRange);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrend = (current: number, previous: number): Trend => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: current,
      change: Math.abs(change),
      isPositive: change > 0
    };
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    trend 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    color: string;
    trend?: Trend;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" weight="bold" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {trend.isPositive ? <TrendUp size={16} /> : <TrendDown size={16} />}
            {trend.change.toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {title}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {t('admin.failedToLoadStatistics')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
            style={{
              backgroundColor: timeRange === range
                ? 'var(--forum-default-active-bg)'
                : 'var(--forum-default-bg)',
              color: timeRange === range
                ? 'var(--forum-default-active-text)'
                : 'var(--forum-default-text)'
            }}
          >
            {range === 'week' ? t('admin.thisWeek') : range === 'month' ? t('admin.thisMonth') : t('admin.allTime')}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.platformOverview')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('admin.totalUsers')}
            value={stats.totalUsers}
            icon={Users}
            color="bg-blue-500"
            trend={getTrend(stats.totalUsers, stats.totalUsers - stats.newUsersThisWeek)}
          />
          <StatCard
            title={t('admin.activeUsers')}
            value={stats.activeUsers}
            icon={Users}
            color="bg-green-500"
          />
          <StatCard
            title={t('admin.newUsersThisWeek')}
            value={stats.newUsersThisWeek}
            icon={Users}
            color="bg-purple-500"
          />
          <StatCard
            title={t('admin.totalPosts')}
            value={stats.totalPosts}
            icon={Article}
            color="bg-indigo-500"
          />
        </div>
      </div>

      {/* Moderation Queue */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.moderationQueue')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title={t('admin.pendingReports')}
            value={stats.pendingReports}
            icon={Flag}
            color="bg-red-500"
          />
          <StatCard
            title={t('admin.resolvedReports')}
            value={stats.resolvedReports}
            icon={Flag}
            color="bg-green-500"
          />
          <StatCard
            title={t('admin.actionsThisWeek')}
            value={stats.moderationActionsThisWeek}
            icon={ChartBar}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Content Reviews */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.contentReviews')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ForkKnife size={20} />
              {t('admin.foodProposals')}
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.pending')}</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingFoodProposals}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.approved')}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.approvedFoodProposals}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('admin.total')}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.pendingFoodProposals + stats.approvedFoodProposals}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users size={20} />
              {t('admin.certificateVerification')}
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.pending')}</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingCertificates}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.verified')}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.verifiedCertificates}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('admin.total')}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.pendingCertificates + stats.verifiedCertificates}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.platformActivity')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.totalComments')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalComments.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.postsPerUser')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(stats.totalPosts / stats.totalUsers).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('admin.engagementRate')}</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationStats;
