
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, LogOut, Users, Gauge, FileBarChart, ShieldAlert, FileText, Download } from 'lucide-react';
import { db } from './db';
import { UserRole, UserSession } from './types';
import { syncData } from './services/syncService';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import MaintenanceForm from './components/MaintenanceForm';
import Reports from './components/Reports';
import Login from './components/Login';
import AdminManagement from './components/AdminManagement';
import BrandLogo from './components/BrandLogo';
import PredictiveModal from './components/PredictiveModal';
import { generateMonthlyReportSummary } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'equipment' | 'maintenance' | 'reports' | 'team'>('dashboard');
  const [session, setSession] = useState<UserSession | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | undefined>(undefined);
  const [maintMode, setMaintMode] = useState<'asset' | 'general'>('asset');
  const [preselectedEquipmentId, setPreselectedEquipmentId] = useState<number | undefined>(undefined);
  const [isPredictiveOpen, setIsPredictiveOpen] = useState(false);
  const [globalAnalysis, setGlobalAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [canInstall, setCanInstall] = useState(false);
  
  const initialSyncExecuted = useRef(false);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try { await syncData(); } finally { setIsSyncing(false); }
  }, [isSyncing]);

  useEffect(() => {
    const handleInstallAvailable = () => setCanInstall(true);
    window.addEventListener('pwa-install-available', handleInstallAvailable);
    
    const handleOnline = () => { setIsOnline(true); triggerSync(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!initialSyncExecuted.current && navigator.onLine) {
      triggerSync();
      initialSyncExecuted.current = true;
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    (window as any).deferredPrompt = null;
  };

  if (!session) return <Login onLogin={setSession} />;

  const isAdmin = session.role === UserRole.ADMIN;

  const handleSelectAssetForOS = (equipmentId: number) => {
    setPreselectedEquipmentId(equipmentId);
    setEditingLogId(undefined);
    setMaintMode('asset');
    setActiveTab('maintenance');
  };

  const handleQuickAction = (action: 'electric' | 'hydraulic' | 'control' | 'general') => {
    setPreselectedEquipmentId(undefined);
    setEditingLogId(undefined);
    setMaintMode(action === 'general' ? 'general' : 'asset');
    setActiveTab('maintenance');
  };

  const handleOpenPredictive = async () => {
    setIsPredictiveOpen(true);
    setIsAnalyzing(true);
    try {
      let allEq = await db.equipment.toArray();
      let allLogs = await db.logs.toArray();
      
      // Filtro rigoroso por condomínio logado
      if (session.condominium?.id) {
        allEq = allEq.filter(e => e.condominiumId === session.condominium?.id);
        allLogs = allLogs.filter(l => l.condominiumId === session.condominium?.id);
      }

      const graphData = allLogs
        .filter(l => l.currentAmperageL1 || l.temperature)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-20)
        .map(l => ({ 
          date: l.date, 
          amp: l.currentAmperageL1 || 0, 
          temp: l.temperature || 0 
        }));
      
      setTrendData(graphData);
      
      const analysis = await generateMonthlyReportSummary(
        new Date().toISOString().slice(0, 7), 
        allEq, 
        allLogs
      );
      setGlobalAnalysis(analysis);
    } catch (err) { 
      setGlobalAnalysis("Falha técnica no processamento de tendências. Verifique a telemetria dos ativos."); 
    } finally { 
      setIsAnalyzing(false); 
    }
  };

  const handleLogout = () => {
    setSession(null);
    setActiveTab('dashboard');
    setEditingLogId(undefined);
    setPreselectedEquipmentId(undefined);
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'equipment', label: 'Planta', icon: Gauge },
    { id: 'maintenance', label: 'Abrir OS', icon: FileText },
    { id: 'reports', label: 'Laudos', icon: FileBarChart },
    ...(isAdmin ? [{ id: 'team', label: 'Gestão', icon: Users }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <button onClick={() => { setActiveTab('dashboard'); setEditingLogId(undefined); setPreselectedEquipmentId(undefined); }} className="hover:opacity-80 transition-opacity flex items-center gap-2">
          <BrandLogo withText={true} size={32} />
        </button>
        <div className="flex items-center gap-3">
          {canInstall && (
            <button 
              onClick={handleInstallApp}
              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
              title="Instalar no Celular"
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase hidden md:inline">Instalar</span>
            </button>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase text-blue-600">{isAdmin ? 'Engenharia Admin' : session.technician?.name}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase">{session.condominium?.name || 'Gestão Global'}</p>
          </div>
          <button onClick={handleLogout} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all border border-transparent hover:border-rose-100">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <Dashboard 
            condominium={session.condominium}
            onQuickAction={handleQuickAction} 
            onOpenPredictive={handleOpenPredictive} 
            onSelectAsset={handleSelectAssetForOS} 
          />
        )}
        {activeTab === 'equipment' && (
          <EquipmentList 
            condominium={session.condominium}
            onSelectEquipment={handleSelectAssetForOS} 
            isAdmin={isAdmin} 
            onAddEquipment={() => setActiveTab('team')} 
          />
        )}
        {activeTab === 'maintenance' && (
          <MaintenanceForm 
            technician={session.technician || {name: 'ADMIN Master', code: 'ADM-001', synced: 1}} 
            condominium={session.condominium || { name: 'Manutenção Geral', address: 'Diversos', synced: 1 }} 
            logId={editingLogId} 
            initialMode={maintMode} 
            preselectedEquipmentId={preselectedEquipmentId} 
            onComplete={() => setActiveTab('reports')} 
          />
        )}
        {activeTab === 'reports' && (
          <Reports 
            isAdmin={isAdmin} 
            sessionCondoId={session.condominium?.id}
            onEditLog={id => { setEditingLogId(id); setActiveTab('maintenance'); }} 
          />
        )}
        {activeTab === 'team' && isAdmin && <AdminManagement />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-slate-900 rounded-[2.5rem] p-2 flex items-center justify-around z-50 shadow-2xl border border-white/10 backdrop-blur-md">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id as any); setEditingLogId(undefined); setPreselectedEquipmentId(undefined); }} 
              className={`flex flex-col items-center gap-1.5 flex-1 transition-all py-3 rounded-3xl ${active ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <PredictiveModal isOpen={isPredictiveOpen} onClose={() => setIsPredictiveOpen(false)} isLoading={isAnalyzing} analysisText={globalAnalysis} trendData={trendData} />
    </div>
  );
};

export default App;
