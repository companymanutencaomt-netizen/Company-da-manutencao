
import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { MaintenanceLog, Equipment, EquipmentStatus, Condominium } from '../types';
import { ShieldCheck, Activity, AlertCircle, Zap, Droplets, Settings, ChevronRight, TrendingUp, FileText, BrainCircuit } from 'lucide-react';

interface Props {
  condominium?: Condominium;
  onQuickAction?: (action: 'electric' | 'hydraulic' | 'control' | 'general') => void;
  onOpenPredictive?: () => void;
  onSelectAsset?: (id: number) => void;
}

const Dashboard: React.FC<Props> = ({ condominium, onQuickAction, onOpenPredictive, onSelectAsset }) => {
  const [stats, setStats] = useState({ 
    totalAssets: 0, 
    operational: 0, 
    warning: 0, 
    critical: 0,
    compliance: 100 
  });
  const [criticalAssets, setCriticalAssets] = useState<Equipment[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        let equipment: Equipment[] = [];
        if (condominium?.id) {
          equipment = await db.equipment.where('condominiumId').equals(condominium.id).toArray();
        } else {
          equipment = await db.equipment.toArray();
        }

        const statsObj = {
          totalAssets: equipment.length,
          operational: equipment.filter(e => e.status === EquipmentStatus.OPERATIONAL).length,
          warning: equipment.filter(e => e.status === EquipmentStatus.WARNING).length,
          critical: equipment.filter(e => e.status === EquipmentStatus.CRITICAL || e.status === EquipmentStatus.OFFLINE).length,
          compliance: equipment.length > 0 ? Math.round((equipment.filter(e => e.status === EquipmentStatus.OPERATIONAL).length / equipment.length) * 100) : 100
        };
        
        setStats(statsObj);
        setCriticalAssets(equipment.filter(e => e.status !== EquipmentStatus.OPERATIONAL).slice(0, 4));
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      }
    };
    load();
  }, [condominium]);

  return (
    <div className="p-4 space-y-6 bg-slate-50 min-h-screen pb-24">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase leading-none">Status de Operação</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
              {condominium?.name || 'Visão Geral de Engenharia'}
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-emerald-100">
            <ShieldCheck className="h-4 w-4" /> Planta Monitorada
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-3xl font-black text-slate-900">{stats.compliance}%</p>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Confiabilidade</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
               <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.compliance}%` }}></div>
            </div>
          </div>
          <div className="space-y-1 border-l border-slate-100 pl-6">
            <p className="text-3xl font-black text-slate-900">{stats.totalAssets}</p>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Ativos na Unidade</p>
          </div>
          <div className="space-y-1 border-l border-slate-100 pl-6">
            <p className={`text-3xl font-black ${stats.critical > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{stats.critical}</p>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Alertas Ativos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" /> Prioridade de OS
            </h3>
            <span className="text-[8px] font-bold text-slate-400 uppercase">Lista Crítica</span>
          </div>
          <div className="space-y-3">
            {criticalAssets.length > 0 ? criticalAssets.map(asset => (
              <div 
                key={asset.id} 
                onClick={() => asset.id && onSelectAsset?.(asset.id)}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 cursor-pointer active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110 ${asset.status === EquipmentStatus.CRITICAL ? 'text-rose-500' : 'text-amber-500'}`}>
                      <Activity className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-[11px] font-black text-slate-900 uppercase leading-none">{asset.name || 'Sem nome'}</p>
                     <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight mt-1">{asset.location || 'Local não definido'}</p>
                   </div>
                </div>
                <div className={`text-[7px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${asset.status === EquipmentStatus.CRITICAL ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  {asset.status || 'Desconhecido'}
                </div>
              </div>
            )) : (
              <div className="py-10 text-center space-y-2 opacity-30">
                <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Operação Nominal</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div onClick={() => onQuickAction?.('electric')} className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-200 flex flex-col justify-between text-white group cursor-pointer active:scale-95 transition-all">
              <Zap className="h-8 w-8 opacity-50 mb-4 group-hover:rotate-12 transition-transform" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Ordens</p>
                <p className="text-lg font-black uppercase">Elétricas</p>
              </div>
           </div>
           <div onClick={() => onQuickAction?.('hydraulic')} className="bg-cyan-500 p-6 rounded-3xl shadow-lg shadow-cyan-200 flex flex-col justify-between text-white group cursor-pointer active:scale-95 transition-all">
              <Droplets className="h-8 w-8 opacity-50 mb-4 group-hover:rotate-12 transition-transform" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Ordens</p>
                <p className="text-lg font-black uppercase">Hidráulicas</p>
              </div>
           </div>
           <div onClick={() => onQuickAction?.('control')} className="bg-slate-900 p-6 rounded-3xl shadow-lg flex flex-col justify-between text-white group cursor-pointer active:scale-95 transition-all">
              <Settings className="h-8 w-8 opacity-50 mb-4 group-hover:rotate-12 transition-transform" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Quadros de</p>
                <p className="text-lg font-black uppercase">Comando</p>
              </div>
           </div>
           <div onClick={() => onQuickAction?.('general')} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between group cursor-pointer active:scale-95 transition-all">
              <FileText className="h-8 w-8 text-blue-600 mb-4 group-hover:rotate-12 transition-transform" />
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nova</p>
                <p className="text-lg font-black text-slate-900 uppercase">OS Avulsa</p>
              </div>
           </div>
        </div>
      </div>

      <button onClick={onOpenPredictive} className="w-full text-left bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-3xl text-white flex items-center justify-between shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 transition-all group-hover:scale-150 duration-700"></div>
         <div className="flex items-center gap-6 relative z-10">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md group-hover:bg-blue-400 group-hover:rotate-12 transition-all">
               <BrainCircuit className="h-8 w-8" />
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h4 className="font-black text-base uppercase tracking-tight">Análise Preditiva do Sistema</h4>
                 <span className="bg-blue-400/30 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">Live IA</span>
               </div>
               <p className="text-[10px] text-blue-100 opacity-80 mt-1 max-w-md font-medium leading-tight">Toque para gerar um diagnóstico completo da saúde dos ativos processado por IA.</p>
            </div>
         </div>
         <ChevronRight className="h-6 w-6 opacity-30 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
      </button>
    </div>
  );
};

export default Dashboard;
