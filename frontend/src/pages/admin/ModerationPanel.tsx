import { useState } from 'react';
import { 
  Users, 
  Article, 
  Flag, 
  ForkKnife,
  ShieldCheck,
  ChartBar,
  Funnel
} from '@phosphor-icons/react';
import UserManagement from './tabs/UserManagement';
import ContentModeration from './tabs/ContentModeration';
import ReportsQueue from './tabs/ReportsQueue';
import FoodProposals from './tabs/FoodProposals';
import CertificateVerification from './tabs/CertificateVerification';
import ModerationStats from './tabs/ModerationStats';

const ModerationPanel = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabs = [
    {
      name: 'Reports Queue',
      icon: Flag,
      component: ReportsQueue,
      description: 'Review flagged content and user reports'
    },
    {
      name: 'Content Moderation',
      icon: Article,
      component: ContentModeration,
      description: 'Manage posts, comments, and community content'
    },
    {
      name: 'User Management',
      icon: Users,
      component: UserManagement,
      description: 'Manage users, roles, and permissions'
    },
    {
      name: 'Certificate Verification',
      icon: ShieldCheck,
      component: CertificateVerification,
      description: 'Verify profession tags and certificates'
    },
    {
      name: 'Food Proposals',
      icon: ForkKnife,
      component: FoodProposals,
      description: 'Review and approve food item submissions'
    },
    {
      name: 'Statistics',
      icon: ChartBar,
      component: ModerationStats,
      description: 'View moderation metrics and insights'
    }
  ];

  const ActiveComponent = tabs[selectedIndex].component;

  return (
    <div className="nh-page-container">
      <div className="nh-container">
        {/* Header */}
        <div className="mb-8">
          <h1 className="nh-title">Moderation Panel</h1>
          <p className="nh-text mt-2">
            Manage content, users, and community standards
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left sidebar - Tab buttons */}
          <div className="w-full md:w-1/5">
            <div className="sticky top-20">
              <h3 className="nh-subtitle mb-4 flex items-center gap-2">
                <Funnel size={20} weight="fill" className="text-primary" />
                Sections
              </h3>
              <div className="flex flex-col gap-3">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => setSelectedIndex(index)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow"
                      style={{
                        backgroundColor: selectedIndex === index
                          ? 'var(--forum-default-active-bg)'
                          : 'var(--forum-default-bg)',
                        color: selectedIndex === index
                          ? 'var(--forum-default-active-text)'
                          : 'var(--forum-default-text)'
                      }}
                    >
                      <Icon size={18} weight="fill" className="flex-shrink-0" />
                      <span className="flex-grow text-left">{tab.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="w-full md:w-3/5">
            <div className="nh-card p-6">
              {/* Section header */}
              <div className="mb-6">
                <h2 className="nh-subtitle mb-1">{tabs[selectedIndex].name}</h2>
                <p className="nh-text">{tabs[selectedIndex].description}</p>
              </div>

              {/* Active component */}
              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationPanel;
