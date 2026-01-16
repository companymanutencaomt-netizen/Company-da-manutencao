
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Equipment, MaintenanceLog, MaintenanceType, Technician, ServiceCategory, Condominium, EquipmentType, EquipmentStatus } from '../types';
import { Camera, Save, Zap, Droplets, Loader2, Thermometer, Gauge, CheckCircle2, Wrench, Layers, Building2 } from 'lucide-react';

interface Props {
  technician: Technician;
  condominium: Condominium;
  onComplete: () => void;
  logId?: number;
  initialMode?: 'asset' | 'general';
  preselectedEquipmentId?: number;
}

const MaintenanceForm: React.FC<Props> = ({ technician, condominium, onComplete, logId, initialMode = 'asset', preselectedEquipmentId }) => {
  const [formMode, setFormMode] = useState<'asset' | 'general'>(initialMode);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedEqId, setSelectedEqId] = useState<number>(preselectedEquipmentId || 0);
  const [log, setLog] = useState<Partial<MaintenanceLog>>({
    type: MaintenanceType.PREVENTIVE,
    date: new Date().toISOString().split('T')[0],
    synced: 0,
    observations: '',
    serviceCategory: ServiceCategory.OTHER
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      // Filtrar ativos apenas do condomínio atual
      let items: Equipment[] = [];
      if (condominium?.id) {
        items = await db.equipment.where('condominiumId').equals(condominium.id).toArray();
      }
      setEquipmentList(items);
      
      if (logId) {
        const item = await db.logs.get(logId);
        if (item) {
          setLog(item);
          if (item.equipmentId) {
            setFormMode('asset');
            setSelectedEqId(item.equipmentId);
          } else {
            setFormMode('general');
          }
        }
      } else if (preselectedEquipmentId) {
        setSelectedEqId(preselectedEquipmentId);
        setFormMode('asset');
      }
    };
    load();
  }, [logId, preselectedEquipmentId, condominium]);

  const selectedEq = equipmentList.find(e => e.id === selectedEqId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let anomaly = false;
    let newStatus = EquipmentStatus.OPERATIONAL;

    if (formMode === 'asset' && selectedEq) {
      const maxAmp = (selectedEq.manufacturerAmperage || 0) * 1.1;
      const currents = [log.currentAmperageL1 || 0, log.currentAmperageL2 || 0, log.currentAmperageL3 || 0];
      const overCurrent = currents.some(c => c > maxAmp);
      const overTemp = (log.temperature || 0) > (selectedEq.maxOperatingTemp || 60);
      
      anomaly = overCurrent || overTemp;
      newStatus = anomaly ? EquipmentStatus.CRITICAL : EquipmentStatus.OPERATIONAL;
      await db.equipment.update(selectedEq.id!, { status: newStatus });
    }

    const logData = {
      ...log,
      condominiumId: condominium?.id || 0,
      equipmentId: formMode === 'asset' ? (selectedEqId || undefined) : undefined,
      serviceCategory: formMode === 'general' ? (log.serviceCategory || ServiceCategory.OTHER) : undefined,
      technicianId: technician?.id || 0,
      anomalyDetected: anomaly,
      synced: 0
    } as MaintenanceLog;

    try {
      if (logId) await db.logs.update(logId, logData);
      else await db.logs.add(logData);
    } catch (err) {
      console.error("Erro ao salvar log:", err);
    } finally {
      setLoading(false);
      onComplete();
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-slate-200 p-1 rounded-3xl flex items-center shadow-inner">
        <button type="button" onClick={() => setFormMode('asset')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formMode === 'asset' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-500'}`}>
          <Layers className="h-4 w-4" /> Ativo
        </button>
        <button type="button" onClick={() => setFormMode('general')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${formMode === 'general' ? 'bg-white shadow-xl text-orange-600' : 'text-slate-500'}`}>
          <Wrench className="h-4 w-4" /> Avulso
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 rounded-xl"><Building2 className="h-4 w-4 text-blue-600" /></div>
               <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unidade</h3>
                  <p className="text-xs font-black text-slate-900 uppercase">{condominium?.name || 'Geral'}</p>
               </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Data</p>
                <p className="text-xs font-black text-slate-900">{new Date(log.date || Date.now()).toLocaleDateString('pt-BR')}</p>
             </div>
          </div>

          <div className="space-y-4">
            {formMode === 'asset' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Equipamento em {condominium?.name}</label>
                <select 
                  required 
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:border-blue-500 transition-all cursor-pointer"
                  value={selectedEqId || ""}
                  onChange={e => setSelectedEqId(e.target.value ? parseInt(e.target.value) : 0)}
                >
                  <option value="">Selecione o Ativo...</option>
                  {equipmentList.map(e => <option key={e.id} value={e.id}>{e.name} — {e.location}</option>)}
                </select>
                {equipmentList.length === 0 && <p className="text-[9px] font-bold text-rose-500 uppercase ml-2">Nenhum ativo cadastrado nesta unidade.</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                <select required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:border-orange-500 transition-all cursor-pointer" value={log.serviceCategory} onChange={e => setLog({...log, serviceCategory: e.target.value as ServiceCategory})}>
                  {Object.values(ServiceCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {formMode === 'asset' && selectedEq && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
             {(selectedEq.type === EquipmentType.PANEL || selectedEq.type === EquipmentType.PUMP || selectedEq.type === EquipmentType.GENSET) && (
               <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Corrente (A)
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['L1', 'L2', 'L3'].map((phase, idx) => (
                      <div key={phase} className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase block text-center">{phase}</label>
                        <input type="number" step="0.1" placeholder="0.0" className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3 text-center text-sm font-black outline-none focus:border-blue-500 transition-all" value={(log as any)[`currentAmperageL${idx+1}`] || ''} onChange={e => setLog({...log, [`currentAmperageL${idx+1}`]: parseFloat(e.target.value)})} />
                      </div>
                    ))}
                  </div>
               </div>
             )}

             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                  <Thermometer className="h-4 w-4" /> Parâmetros de Estado
                </h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Temp (°C)</label>
                      <input type="number" step="0.1" placeholder="0.0" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-orange-500 transition-all" value={log.temperature || ''} onChange={e => setLog({...log, temperature: parseFloat(e.target.value)})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pressão (BAR)</label>
                      <input type="number" step="0.1" placeholder="0.0" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black outline-none focus:border-cyan-500 transition-all" value={log.pressureBar || ''} onChange={e => setLog({...log, pressureBar: parseFloat(e.target.value)})} />
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Relato do Técnico</label>
           <textarea placeholder="Descreva as intervenções realizadas..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-xs font-medium h-32 outline-none focus:border-slate-400 transition-all resize-none" value={log.observations} onChange={e => setLog({...log, observations: e.target.value})} />
           
           <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-full py-8 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center gap-2 transition-all ${log.photoBase64 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              {log.photoBase64 ? <img src={log.photoBase64} className="h-24 w-24 object-cover rounded-2xl" /> : <Camera className="h-10 w-10 text-slate-300" />}
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{log.photoBase64 ? 'Foto OK' : 'Anexar Foto'}</span>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onloadend = () => setLog({...log, photoBase64: r.result as string});
                  r.readAsDataURL(f);
                }
              }} />
           </button>
        </div>

        <button type="submit" disabled={loading || (formMode === 'asset' && !selectedEqId)} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="h-5 w-5" /> Salvar OS</>}
        </button>
      </form>
    </div>
  );
};

export default MaintenanceForm;
