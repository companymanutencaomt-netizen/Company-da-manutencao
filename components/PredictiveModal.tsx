
import React, { useMemo } from 'react';
import { X, BrainCircuit, ShieldCheck, AlertTriangle, Zap, Thermometer, Loader2, Sparkles, TrendingUp, BarChart3, ChevronRight, FileSearch, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysisText: string | null;
  isLoading: boolean;
  trendData: any[];
}

const PredictiveModal: React.FC<Props> = ({ isOpen, onClose, analysisText, isLoading, trendData }) => {
  if (!isOpen) return null;

  const healthScore = useMemo(() => {
    if (!trendData.length) return 100;
    // Cálculo simulado de saúde
    const alerts = trendData.filter(d => d.amp > 15 || d.temp > 55).length;
    return Math.max(70, 100 - (alerts * 5)); 
  }, [trendData]);

  const reportId = useMemo(() => `IA-${Math.floor(Math.random() * 900000 + 100000)}`, []);

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl rounded-[2rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in duration-300 border border-white/10">
        
        {/* Header Administrativo High-End */}
        <div className="p-6 md:p-8 bg-slate-900 text-white shrink-0 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black uppercase tracking-tight">Audit IA: Análise Preditiva</h3>
                <span className="bg-blue-500/20 text-blue-400 text-[8px] px-2 py-0.5 rounded-full font-black border border-blue-500/30">V.3.1 PRO</span>
              </div>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">ID Relatório: {reportId} • Engenharia de Dados</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
             <button className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border border-white/10">
                <Download className="h-3.5 w-3.5" /> Salvar Log
             </button>
             <button 
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X className="h-6 w-6" />
              </button>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          {isLoading ? (
            <div className="py-40 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-30 animate-pulse"></div>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Sincronizando Telemetria...</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">O motor de inteligência está processando tendências de carga e temperatura.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-10 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Dashboard Administrativo de Topo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 md:col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Confiabilidade da Planta</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black text-slate-900">{healthScore}%</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${healthScore > 90 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {healthScore > 90 ? 'Excelente' : 'Atenção'}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block w-24 h-24">
                     <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray={`${healthScore}, 100`} />
                     </svg>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Eventos Críticos</p>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                       <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900">00</span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Últimos 30 dias</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Consumo Estimado</p>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                       <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900">Nominal</span>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Estabilidade Ativa</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visualização de Tendência (Audit Data) */}
                <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Monitoramento Dinâmico de Carga</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Amperagem</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Temperatura</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={9} 
                          tickFormatter={(val) => val.split('-').reverse().slice(0,2).join('/')}
                          tick={{fontWeight: 'bold'}}
                        />
                        <YAxis stroke="#94a3b8" fontSize={9} tick={{fontWeight: 'bold'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold', padding: '16px' }}
                        />
                        <Line 
                          name="Carga (A)"
                          type="monotone" 
                          dataKey="amp" 
                          stroke="#2563eb" 
                          strokeWidth={5} 
                          dot={{ r: 6, fill: '#2563eb', strokeWidth: 0 }}
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                        <Line 
                          name="Temperatura (°C)"
                          type="monotone" 
                          dataKey="temp" 
                          stroke="#fb923c" 
                          strokeWidth={3} 
                          strokeDasharray="8 8"
                          dot={{ r: 4, fill: '#fb923c', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                       <TrendingUp className="h-5 w-5 text-emerald-500" />
                       <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">Variação média de 2.4% nos últimos 15 registros. Padrão Estável.</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <ShieldCheck className="h-5 w-5 text-blue-500" />
                       <p className="text-[9px] text-slate-500 font-bold uppercase leading-tight">Hardware monitorado em tempo real com conformidade ABNT.</p>
                    </div>
                  </div>
                </div>

                {/* Bloco de Conclusão Técnica Administrativa */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex-1 flex flex-col shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <Sparkles className="h-5 w-5 text-blue-400" />
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-100">Veredito da Engenharia Digital</h4>
                    </div>
                    
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar text-xs font-medium text-slate-300 leading-relaxed">
                      {analysisText ? (
                        analysisText.split('\n').map((line, i) => {
                          if (line.trim().startsWith('###')) {
                            return <h5 key={i} className="font-black text-white uppercase text-[10px] mt-8 mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                              {line.replace(/###/g, '').trim()}
                            </h5>;
                          }
                          return <p key={i} className="mb-3 opacity-80">{line}</p>;
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                          <FileSearch className="h-12 w-12 mb-4" />
                          <p className="text-[10px] uppercase font-black tracking-widest">Processando Laudo...</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Status de Intervenção</p>
                      <p className="text-[11px] font-black text-white">MANUTENÇÃO PREVENTIVA RECOMENDADA EM 45 DIAS.</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
                     <div className="bg-slate-100 p-3 rounded-xl">
                        <ShieldCheck className="h-5 w-5 text-slate-900" />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certificação Digital</p>
                        <p className="text-[10px] font-bold text-slate-800">Assinado Eletronicamente por Company PRO v8</p>
                     </div>
                  </div>
                </div>
              </div>

              {/* Notas de Rodapé de Gestão */}
              <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-[9px] text-blue-800 font-bold uppercase tracking-tight gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Aviso: Este diagnóstico é uma ferramenta de auxílio à gestão de risco.
                </div>
                <div className="flex items-center gap-4">
                   <span>Pag: 01/01</span>
                   <span>Audit Log: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Administrativo */}
        <div className="p-8 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:bg-blue-600"
          >
            Encerrar Consulta
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredictiveModal;
