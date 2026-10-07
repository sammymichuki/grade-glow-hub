import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Activity, Box, Container, Gauge, RefreshCw, Router, ShieldCheck, Wifi } from 'lucide-react';
import { EdgeSyncStatusWidget } from '@/features/edge-mesh/components/EdgeSyncStatusWidget';
import { BandwidthOptimizerSettings } from '@/features/pwa-worker/components/BandwidthOptimizerSettings';
import {
  registerServiceWorker,
  RegistrationHandle,
} from '@/features/pwa-worker/services/serviceWorkerRegistration';
import { edgeNodeService, EdgeNodeService } from '@/features/edge-mesh/services/edgeNodeService';
import { EDGE_DEPLOYMENT_ENDPOINTS } from '@/features/edge-mesh/data/sampleEdgeData';
import { Button } from '@/components/ui/button';

type EdgeMeshTab = 'status' | 'bandwidth' | 'deploy';

const TABS: Array<{ id: EdgeMeshTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'status', label: 'Edge Sync Status', icon: Activity },
  { id: 'bandwidth', label: 'Bandwidth Optimizer', icon: Gauge },
  { id: 'deploy', label: 'Edge Box Deployment', icon: Container },
];

const DOCKER_SNIPPET = `# from the repository root (SPA build first)
npm run build
docker compose -f edge-box/docker-compose.yml up -d --build

# verify the box
curl http://192.168.4.1:8080/api/health`;

const RPI_SNIPPET = `# Raspberry Pi 5 (64-bit Raspberry Pi OS)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
sudo raspi-config  # → Localisation → set Wi-Fi country / hotspot SSID
npm run build && docker compose -f edge-box/docker-compose.yml up -d

# persist the school hotspot (NetworkManager)
sudo nmcli device wifi hotspot ifname wlan0 ssid GradeGlowMesh password "schoolnet"`;

const CLOUD_SYNC_SNIPPET = `# opportunistic cloud sync (runs only while a WAN link exists)
EDGE_CLOUD_URL=https://api.gradeglow.example \\
EDGE_AUTH_TOKEN=<school-token> \\
EDGE_SYNC_INTERVAL_MS=300000 \\
docker compose -f edge-box/docker-compose.yml up -d`;

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

export const EdgeMeshPage: React.FC<{ service?: EdgeNodeService }> = ({ service }) => {
  const [activeTab, setActiveTab] = useState<EdgeMeshTab>('status');
  const [serviceWorkerHandle, setServiceWorkerHandle] = useState<RegistrationHandle | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const activeService = service ?? edgeNodeService;
  const nodes = activeService.getNodes();

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    registerServiceWorker().then((handle) => {
      if (!mounted || !handle) return;
      setServiceWorkerHandle(handle);
      unsubscribe = handle.onUpdateAvailable(() => setUpdateReady(true));
    });
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 container-custom py-8 space-y-6">
        <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Wifi className="h-3.5 w-3.5 text-emerald-300" /> Offline-First · School Mesh Box
              </span>
              <span className="text-xs font-semibold bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Zero-Cost LAN Learning
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Edge Mesh & Ultra-Low Bandwidth Delivery
            </h1>

            <p className="text-sm sm:text-base text-teal-100 leading-relaxed">
              Delta-sync JSON patches over intermittent 2G/3G, a Dockerized school edge box for
              internet-free classrooms, service-worker caching strategies and a data-saver mode that
              keeps every lesson under 500 KB.
            </p>
          </div>
        </div>

        {updateReady && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <span className="text-xs font-semibold text-emerald-900">
              A fresh build of the offline shell is installed and waiting to activate.
            </span>
            <Button
              size="sm"
              className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
              onClick={() => serviceWorkerHandle?.applyUpdate()}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Activate Update
            </Button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'status' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EdgeSyncStatusWidget service={activeService} />
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
                Discovered Mesh Boxes
              </h3>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-start gap-3"
                >
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                    <Router className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">{node.label}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{node.lanAddress}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          node.status === 'online'
                            ? 'bg-emerald-100 text-emerald-800'
                            : node.status === 'edge-only'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {node.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {node.connectedClients} clients · {formatBytes(node.storageUsedBytes)} used
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 p-4 text-[11px] text-teal-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <Box className="h-3.5 w-3.5" /> Opportunistic Sync
                </span>
                The box pushes quiz grades and pulls curriculum updates whenever any teacher device
                reaches cellular internet — students keep learning on the LAN at zero data cost.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bandwidth' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BandwidthOptimizerSettings />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 h-fit">
              <h3 className="text-sm font-bold text-gray-900">Why It Matters</h3>
              <ul className="space-y-3 text-xs text-gray-600 leading-relaxed">
                <li className="flex gap-2">
                  <span className="font-bold text-teal-700">01</span>
                  Rich video lessons cost ~19 MB each; data-saver narration stays below 500 KB.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-teal-700">02</span>
                  Service workers serve lessons stale-while-revalidate so repeats cost zero bytes.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-teal-700">03</span>
                  Quiz submissions are prioritized ahead of progress and telemetry in every delta.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-teal-700">04</span>
                  The metered-connection rule flips students to data-saver on 2G/3G automatically.
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Container className="h-4 w-4 text-cyan-700" /> School Mesh Box — Docker
              </h3>
              <pre className="text-[11px] leading-relaxed bg-gray-900 text-emerald-300 rounded-xl p-4 overflow-x-auto">
                {DOCKER_SNIPPET}
              </pre>
              <h4 className="text-xs font-bold text-gray-800">Raspberry Pi 5 / school desktop</h4>
              <pre className="text-[11px] leading-relaxed bg-gray-900 text-emerald-300 rounded-xl p-4 overflow-x-auto">
                {RPI_SNIPPET}
              </pre>
              <h4 className="text-xs font-bold text-gray-800">Opportunistic cloud-sync config</h4>
              <pre className="text-[11px] leading-relaxed bg-gray-900 text-emerald-300 rounded-xl p-4 overflow-x-auto">
                {CLOUD_SYNC_SNIPPET}
              </pre>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 h-fit">
              <h3 className="text-sm font-bold text-gray-900">Edge Box REST Endpoints</h3>
              <div className="space-y-2">
                {EDGE_DEPLOYMENT_ENDPOINTS.map((endpoint) => (
                  <div
                    key={`${endpoint.method}-${endpoint.path}`}
                    className="flex flex-wrap items-start gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50/60"
                  >
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        endpoint.method === 'GET'
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <code className="text-[11px] font-mono font-semibold text-gray-900 break-all">
                      {endpoint.path}
                    </code>
                    <span className="text-[11px] text-gray-500 w-full">{endpoint.description}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        endpoint.auth
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {endpoint.auth ? 'Bearer token required' : 'Open (monitoring)'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                The box serves the built SPA from <code className="font-mono">dist/</code> with an
                SPA fallback, stores changes in a JSON file volume, and accepts deltas shaped exactly
                like <code className="font-mono">edgeSyncProtocol</code> patches.
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EdgeMeshPage;
