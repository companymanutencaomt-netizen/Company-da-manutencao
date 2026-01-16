
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Technician, UserRole, UserSession, Condominium } from '../types';
import { Search, ChevronRight, UserCircle2, Loader2, AlertCircle, Building2, MapPin, UserCheck, Users } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface Props {
  onLogin: (session: UserSession) => void;
}

const ADMIN_MASTER_PIN = '1234';

const Login: React.FC<Props> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techs, setTechs] = useState<Technician[]>([]);
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const allTechs = await db.technicians.toArray();
        const allCondos = await db.condominiums.toArray();
        setTechs(allTechs);
        setCondos(allCondos);
      } catch (err) {
        setError('Erro ao carregar banco de dados local.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTechs = useMemo(() => {
    return techs.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [techs, searchTerm]);

  const filteredCondos = useMemo(() => {
    return condos.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [condos, searchTerm]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_MASTER_PIN) {
      onLogin({ role: UserRole.ADMIN });
    } else {
      setError('PIN de acesso incorreto');
      setPin('');
    }
  };

  const handleCondoSelection = (condo: Condominium) => {
    if (!selectedTech) return;
    onLogin({ 
      role: UserRole.TECHNICIAN, 
      technician: selectedTech,
      condominium: condo 
    });
  };

  const resetSelection = () => {
    setRole(null);
    setSelectedTech(null);
    setSearchTerm('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-sm bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header de Marca - Logo agora é o centro total */}
        <div className="pt-12 pb-8 text-center flex flex-col items-center bg-white">
          <BrandLogo size={84} withText={true} className="mb-4" />
          <div className="w-12 h-1 bg-blue-600 rounded-full mt-4 opacity-20"></div>
        </div>

        <div className="p-8 pt-4 flex-1 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100 animate-in fade-in zoom-in duration-200">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}

          {!role ? (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-6">Ambiente de Acesso</p>
              
              <button 
                onClick={() => { setRole(UserRole.TECHNICIAN); setSearchTerm(''); }}
                className="w-full flex items-center justify-between p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                <div className="text-left">
                  <span className="block font-black uppercase text-sm tracking-tight">Painel Operacional</span>
                  <span className="text-[9px] opacity-60 uppercase font-bold tracking-widest mt-1 block">Manutenção Condominial</span>
                </div>
                <UserCircle2 className="h-6 w-6 opacity-40" />
              </button>

              <button 
                onClick={() => { setRole(UserRole.ADMIN); setSearchTerm(''); }}
                className="w-full flex items-center justify-between p-6 border-2 border-slate-100 rounded-[2rem] hover:border-blue-600 group transition-all active:scale-95 bg-white"
              >
                <div className="text-left">
                  <span className="block font-black uppercase text-sm text-slate-900 tracking-tight">Gestão Central</span>
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1 block">Módulo Engenharia</span>
                </div>
                <ChevronRight className="h-6 w-6 text-slate-200 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-8 duration-300 space-y-4">
               <button 
                onClick={resetSelection} 
                className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6 hover:bg-blue-50 px-3 py-2 rounded-xl transition-all"
               >
                 ← Alterar Perfil
               </button>
               
               {role === UserRole.TECHNICIAN && !selectedTech ? (
                 <div className="space-y-4">
                   <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Identificação</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Selecione seu registro técnico</p>
                   </div>

                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar seu nome..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>

                   <div className="grid gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                     {filteredTechs.map(t => (
                       <button 
                        key={t.id} 
                        onClick={() => { setSelectedTech(t); setSearchTerm(''); }} 
                        className="w-full text-left p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-between group shadow-sm"
                       >
                         <div>
                            <p className="font-black text-slate-900 text-xs uppercase group-hover:text-blue-600 transition-colors">{t.name}</p>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">REGISTRO: {t.code}</p>
                         </div>
                         <UserCheck className="h-4 w-4 text-slate-200 group-hover:text-blue-600 transition-colors" />
                       </button>
                     ))}
                   </div>
                 </div>
               ) : role === UserRole.TECHNICIAN && selectedTech ? (
                 <div className="space-y-4">
                   <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Onde você está?</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Local do atendimento</p>
                   </div>

                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar condomínio..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>

                   <div className="grid gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                     {filteredCondos.map(c => (
                       <button 
                        key={c.id} 
                        onClick={() => handleCondoSelection(c)} 
                        className="w-full text-left p-5 bg-white rounded-2xl border border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all group shadow-sm"
                       >
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 transition-colors">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 text-xs uppercase group-hover:text-blue-600 transition-colors">{c.name}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[180px]">{c.address}</p>
                            </div>
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               ) : (
                 <form onSubmit={handleAdminLogin} className="space-y-6">
                   <div className="text-center space-y-2">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Acesso Restrito</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PIN de Administrador</p>
                   </div>
                   <input 
                     type="password"
                     inputMode="numeric"
                     placeholder="••••"
                     autoFocus
                     maxLength={4}
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 text-center text-4xl font-black outline-none focus:border-blue-600 transition-all tracking-[0.5em]"
                     value={pin}
                     onChange={e => setPin(e.target.value)}
                   />
                   <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-100 active:scale-95 transition-all"
                   >
                     Autenticar
                   </button>
                 </form>
               )}
            </div>
          )}
        </div>
        <div className="p-6 text-center bg-slate-50/50">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.3em]">Engenharia Condominial Inteligente</p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Login;
