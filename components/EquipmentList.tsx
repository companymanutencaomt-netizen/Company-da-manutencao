
import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { Equipment, EquipmentType, EquipmentStatus, Condominium } from '../types';
import { Search, Plus, MapPin, Zap, Droplets, Info, AlertTriangle, CheckCircle2, ChevronRight, Database } from 'lucide-react';

interface Props {
  condominium?: Condominium;
  onSelectEquipment?: (id: number) => void;
  onAddEquipment?: () => void;
  isAdmin?: boolean;
}

const EquipmentList: React.FC<Props> = ({ condominium, onSelectEquipment, onAddEquipment, isAdmin }) => {
  const [list, setList] = useState<Equipment[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    let items: Equipment[] = [];
    if (condominium?.id) {
      items = await db.equipment.where('condominiumId').equals(condominium.id).toArray();
    } else {
      items = await db.equipment.toArray();
    }
    setList(items);
  };

  useEffect(() => { load(); }, [condominium]);

  const filtered = list.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    if (isAdmin) {
      onAddEquipment?.();
    } else {
      alert("Apenas administradores podem cadastrar novos ativos.");
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
           <input 
             type="text" 
             placeholder={`Localizar em ${condominium?.name || 'ativos'}...`}
             className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
        </div>
        <button 
          onClick={handleAddClick}
          className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl hover:bg-blue-600 active:scale-90 transition-all"
        >
           <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3">
        {filtered.map(item => (
          <div 
            key={item.id} 
            onClick={() => item.id && onSelectEquipment?.(item.id)}
            className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md hover:border-blue-100 cursor-pointer active:scale-[0.98] transition-all"
          >
             <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-all ${
                  item.status === EquipmentStatus.OPERATIONAL ? 'bg-emerald-50 text-emerald-600' :
                  item.status === EquipmentStatus.WARNING ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                   {item.type === EquipmentType.PUMP ? <Droplets className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">{item.name}</h4>
                      {item.status === EquipmentStatus.OPERATIONAL && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                   </div>
                   <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{item.location}</span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Capacidade</p>
                   <p className="text-[11px] font-mono font-black text-slate-900">{item.manufacturerAmperage}A</p>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                   <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                     item.status === EquipmentStatus.OPERATIONAL ? 'bg-emerald-100 text-emerald-700' :
                     item.status === EquipmentStatus.WARNING ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                   }`}>
                      {item.status}
                   </span>
                   <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-blue-500 transition-colors" />
                </div>
             </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center text-slate-300">
             <Database className="h-12 w-12 mx-auto opacity-10 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum Ativo Encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentList;
