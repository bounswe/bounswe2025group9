import { useState, useEffect } from 'react';
import { ShieldCheck, X, Check, Eye, Download } from '@phosphor-icons/react';

interface UserTag {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  tag: {
    id: number;
    name: string;
  };
  verified: boolean;
  certificate: string | null;
  createdAt: string;
}

// Mock data for UI-only PR
const MOCK_USER_TAGS: UserTag[] = [
  {
    id: 1,
    user: { id: 21, username: 'dr_aylin', email: 'aylin@example.com' },
    tag: { id: 101, name: 'Dietitian' },
    verified: false,
    certificate: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 2,
    user: { id: 22, username: 'chef_ali', email: 'ali@example.com' },
    tag: { id: 102, name: 'Chef' },
    verified: true,
    certificate: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const CertificateVerification = () => {
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);

  useEffect(() => {
    fetchUserTags();
  }, [filter]);

  const fetchUserTags = async () => {
    setLoading(true);
    let data = [...MOCK_USER_TAGS];
    if (filter === 'pending') data = data.filter(t => !t.verified);
    if (filter === 'verified') data = data.filter(t => t.verified);
    setTimeout(() => {
      setUserTags(data);
      setLoading(false);
    }, 200);
  };

  const handleVerify = async (_userTagId: number, _approve: boolean) => {
    alert('Moderation API is not included in this PR.');
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
      <div className="flex gap-2">
        {(['all', 'pending', 'verified'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
            style={{
              backgroundColor: filter === status
                ? 'var(--forum-default-active-bg)'
                : 'var(--forum-default-bg)',
              color: filter === status
                ? 'var(--forum-default-active-text)'
                : 'var(--forum-default-text)'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* User Tags List */}
      <div className="grid gap-4">
        {userTags.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <ShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
            <p>No certificates to review</p>
          </div>
        ) : (
          userTags.map((userTag) => (
            <div
              key={userTag.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {userTag.user.username}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {userTag.user.email}
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <ShieldCheck size={14} />
                      {userTag.tag.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {userTag.verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Check size={14} weight="bold" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {userTag.certificate && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCertificate(userTag.certificate)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Eye size={16} />
                      View Certificate
                    </button>
                    <a
                      href={userTag.certificate}
                      download
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </div>

                  {!userTag.verified && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerify(userTag.id, true)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} weight="bold" />
                        Approve Certificate
                      </button>
                      <button
                        onClick={() => handleVerify(userTag.id, false)}
                        className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                      >
                        <X size={16} weight="bold" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Submitted: {new Date(userTag.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCertificate(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Certificate Preview
              </h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <iframe
                src={selectedCertificate}
                className="w-full h-[600px]"
                title="Certificate Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateVerification;
