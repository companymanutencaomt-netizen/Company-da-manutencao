import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Technician, Condominium, Equipment, EquipmentType, EquipmentStatus } from '../types';
import { Trash2, Search, Plus, Building2, Loader2, Gauge, X, HardHat } from 'lucide-react';
import { syncData } from '../services/syncService';

const AdminManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'techs' | 'condos' | 'equip'>('techs');
  const [techs, setTechs] = useState<Technician[]>([]);
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', code: '', address: '', type: EquipmentType.PUMP, location: '', 
    manufacturerAmperage: 0, maxOperatingTemp: 60, nominalPressure: 0, condominiumId: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTechs, allCondos, allEquip] = await Promise.all([
        db.technicians.toArray(),
        db.condominiums.toArray(),
        db.equipment.toArray()
      ]);
      setTechs(allTechs);
      setCondos(allCondos);
      setEquipments(allEquip);
    } catch (err) {
      console.error("Erro ao carregar dados locais:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenForm = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        name: item.name, 
        code: item.code || '', 
        address: item.address || '', 
        type: item.type || EquipmentType.PUMP, 
        location: item.location || '', 
        manufacturerAmperage: item.manufacturerAmperage || 0, 
        maxOperatingTemp: item.maxOperatingTemp || 60, 
        nominalPressure: item.nominalPressure || 0,
        condominiumId: item.condominiumId || 0
      });
    } else {
      setEditingItem(null);
      setFormData({ 
        name: '', code: '', address: '', type: EquipmentType.PUMP, location: '', 
        manufacturerAmperage: 0, maxOperatingTemp: 60, nominalPressure: 0, 
        condominiumId: condos[0]?.id || 0 
      });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeSubTab === 'techs') {
        const payload = { name: formData.name, code: formData.code, synced: 0 };
        if (editingItem) await db.technicians.update(editingItem.id, payload);
        else await db.technicians.add(payload as Technician);
      } else if (activeSubTab === 'condos') {
        const payload = { name: formData.name, address: formData.address, synced: 0 };
        if (editingItem) await db.condominiums.update(editingItem.id, payload);
        else await db.condominiums.add(payload as Condominium);
      } else if (activeSubTab === 'equip') {
        if (!formData.condominiumId) throw new Error("Selecione um condomínio");
        const payload = { 
          condominiumId: Number(formData.condominiumId),
          name: formData.name, 
          type: formData.type, 
          location: formData.location, 
          status: editingItem?.status || EquipmentStatus.OPERATIONAL, 
          manufacturerAmperage: Number(formData.manufacturerAmperage), 
          maxOperatingTemp: Number(formData.maxOperatingTemp), 
          nominalPressure: formData.nominalPressure ? Number(formData.nominalPressure) : undefined, 
          synced: 0 
        };
        if (editingItem) await db.equipment.update(editingItem.id, payload);
        else await db.equipment.add(payload as Equipment);
      }
      setShowForm(false);
      await loadData();
      if (navigator.onLine) syncData();
    } catch (err: any) { 
      alert(err.message || "Falha ao salvar registro."); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number | undefined) => {
    e.stopPropagation();
    if (!id || !window.confirm("Deseja realmente excluir este registro? Isso pode afetar laudos históricos.")) return;
    
    try {
      if (activeSubTab === 'techs') await db.technicians.delete(id);
      else if (activeSubTab === 'condos') await db.condominiums.delete(id);
      else if (activeSubTab === 'equip') await db.equipment.delete(id);
      await loadData();
    } catch (err) {
      console.error("Erro na exclusão:", err);
    }
  };

  const filteredItems = () => {
    const base = activeSubTab === 'techs' ? techs : activeSubTab === 'condos' ? condos : equipments;
    return base.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 shadow-inner">
          <button onClick={() => { setActiveSubTab('techs'); setSearch(''); }} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeSubTab === 'techs' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Técnicos</button>
          <button onClick={() => { setActiveSubTab('condos'); setSearch(''); }} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeSubTab === 'condos' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Unidades</button>
          <button onClick={() => { setActiveSubTab('equip'); setSearch(''); }} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${activeSubTab === 'equip' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Ativos</button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 px-2 gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => handleOpenForm()} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-200 active:scale-95 transition-all">
            <Plus className="h-4 w-4" /> Cadastrar Novo
          </button>
        </div>

        <div className="space-y-3">
          {filteredItems().map((item: any) => (
            <div 
              key={item.id} 
              onClick={() => handleOpenForm(item)} 
              className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between group shadow-sm cursor-pointer active:scale-[0.99] hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-blue-600 transition-all">
                  {activeSubTab === 'techs' ? <HardHat className="h-5 w-5" /> : activeSubTab === 'condos' ? <Building2 className="h-5 w-5" /> : <Gauge className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase">{item.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    {activeSubTab === 'techs' ? `Registro: ${item.code}` : activeSubTab === 'condos' ? item.address : `${item.type} • ${item.location}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => handleDelete(e, item.id)} className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <form onSubmit={handleSave} className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                  {editingItem ? 'Editar' : 'Novo'} {activeSubTab === 'techs' ? 'Técnico' : activeSubTab === 'condos' ? 'Unidade' : 'Ativo'}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Nome Completo</label>
                  <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black outline-none focus:border-blue-500 transition-all uppercase" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                </div>
                
                {activeSubTab === 'techs' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Registro Profissional (CREA/CFT)</label>
                    <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black outline-none focus:border-blue-500 transition-all" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                  </div>
                )}
                
                {activeSubTab === 'condos' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Endereço Completo</label>
                    <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black outline-none focus:border-blue-500 transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                )}
                
                {activeSubTab === 'equip' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Unidade / Condomínio</label>
                      <select required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black outline-none focus:border-blue-500 transition-all" value={formData.condominiumId} onChange={e => setFormData({...formData, condominiumId: parseInt(e.target.value)})}>
                        <option value="0">Selecione...</option>
                        {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Tipo de Ativo</label>
                        <select className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as EquipmentType})}>
                          {Object.values(EquipmentType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Localização</label>
                        <input required type="text" className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-xs font-black" placeholder="Ex: Casa de Máquinas" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirmar e Salvar'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;