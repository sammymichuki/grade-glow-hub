import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Building2, Layers, Paintbrush, RefreshCw, ShieldCheck } from 'lucide-react';
import { DistrictOverviewDashboard } from '@/features/multi-tenancy/components/DistrictOverviewDashboard';
import { WhiteLabelCustomizer } from '@/features/multi-tenancy/components/WhiteLabelCustomizer';
import { SISTabSyncManager } from '@/features/sis-integrations/components/SISTabSyncManager';

type DistrictTab = 'overview' | 'branding' | 'sis';

export const DistrictPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DistrictTab>('overview');

  const tabs: Array<{ id: DistrictTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'District Overview', icon: <Building2 className="w-4 h-4" /> },
    { id: 'branding', label: 'White-Label Studio', icon: <Paintbrush className="w-4 h-4" /> },
    { id: 'sis', label: 'SIS Sync', icon: <RefreshCw className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container-custom py-8 space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-education-primary rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Layers className="h-3.5 w-3.5 text-amber-300" /> Enterprise Multi-Tenancy
              </span>
              <span className="text-xs font-semibold bg-emerald-400 text-emerald-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Strict Tenant Isolation
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              District Command &amp; White-Label Studio
            </h1>

            <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
              Organization → School → Campus → Academic Year → Grade → Section hierarchy with
              hostname-resolved tenant scoping, white-label branding, and OneRoster 1.2 / LTI 1.3
              interoperability across every school in the district.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' && <DistrictOverviewDashboard />}
        {activeTab === 'branding' && <WhiteLabelCustomizer />}
        {activeTab === 'sis' && <SISTabSyncManager />}
      </main>

      <Footer />
    </div>
  );
};

export default DistrictPage;
