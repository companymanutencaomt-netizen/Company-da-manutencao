
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { MaintenanceLog, Equipment, Technician, MaintenanceType, Condominium } from '../types';
import { FileText, Download, Share2, Calendar, Filter, HardHat, Info, Wrench, Gauge, Loader2, Building2, Edit2, Trash2, CheckCircle2, FileCheck } from 'lucide-react';
import { generateMonthlyReportSummary } from '../services/geminiService';

declare var html2pdf: any;

interface Props {
  isAdmin?: boolean;
  sessionCondoId?: number;
  onEditLog?: (id: number) => void;
}

const Reports: React.FC<Props> = ({ isAdmin, sessionCondoId, onEditLog }) => {
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [condos, setCondos] = useState<Condominium[]>([]);
  
  const [selectedTechId, setSelectedTechId] = useState<string>('all');
  const [selectedCondoId, setSelectedCondoId] = useState<string>(sessionCondoId ? sessionCondoId.toString() : 'all');
  
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const requestVersionRef = useRef(0);

  const loadData = async (version: number) => {
    setLoading(true);
    
    try {
      const allLogs = await db.logs.toArray();
      const allEq = await db.equipment.toArray();
      const allTechs = await db.technicians.toArray();
      const allCondos = await db.condominiums.toArray();
      
      if (version !== requestVersionRef.current) return;

      let filtered = allLogs.filter(l => l.date.startsWith(reportMonth));
      
      if (selectedTechId !== 'all') {
        filtered = filtered.filter(l => l.technicianId === parseInt(selectedTechId));
      }

      // Aplicar filtro de condomínio (sempre filtrado se não for admin)
      const currentCondoFilter = !isAdmin && sessionCondoId ? sessionCondoId.toString() : selectedCondoId;
      if (currentCondoFilter !== 'all') {
        filtered = filtered.filter(l => l.condominiumId === parseInt(currentCondoFilter));
      }

      setLogs(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setEquipment(allEq);
      setTechnicians(allTechs);
      setCondos(allCondos);
      
      if (filtered.length > 0 && navigator.onLine) {
        const res = await generateMonthlyReportSummary(reportMonth, allEq, filtered);
        if (version === requestVersionRef.current) {
          setSummary(res || "Relatório técnico processado.");
        }
      } else {
        if (version === requestVersionRef.current) {
          setSummary(null);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
    } finally {
      if (version === requestVersionRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => { 
    requestVersionRef.current += 1;
    loadData(requestVersionRef.current); 
  }, [reportMonth, selectedTechId, selectedCondoId, isAdmin, sessionCondoId]);

  const handleDeleteLog = async (id: number) => {
    if (!confirm("Deseja realmente excluir este registro técnico?")) return;
    try {
      await db.logs.delete(id);
      requestVersionRef.current += 1;
      loadData(requestVersionRef.current);
    } catch (error) {
      alert("Erro ao excluir registro.");
    }
  };

  const handleGenerateOSPDF = async (log: MaintenanceLog) => {
    const eq = equipment.find(e => e.id === log.equipmentId);
    const tech = technicians.find(t => t.id === log.technicianId);
    const condo = condos.find(c => c.id === log.condominiumId);

    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.background = 'white';
    element.style.fontFamily = 'Inter, sans-serif';
    
    element.innerHTML = `
      <div style="border: 2px solid #000; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase;">Company da Manutenção</h1>
            <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 700; color: #666; letter-spacing: 2px;">ORDEM DE SERVIÇO INDIVIDUAL</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; font-weight: 900;">DATA: ${log.date.split('-').reverse().join('/')}</p>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #888;">ID: OS-${log.id || 'N/A'}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div>
            <p style="font-size: 9px; font-weight: 900; color: #999; text-transform: uppercase; margin-bottom: 5px;">CLIENTE / CONDOMÍNIO</p>
            <p style="font-size: 14px; font-weight: 900; margin: 0;">${condo?.name || 'Não informado'}</p>
            <p style="font-size: 10px; color: #666; margin: 3px 0 0 0;">${condo?.address || '-'}</p>
          </div>
          <div>
            <p style="font-size: 9px; font-weight: 900; color: #999; text-transform: uppercase; margin-bottom: 5px;">RESPONSÁVEL TÉCNICO</p>
            <p style="font-size: 14px; font-weight: 900; margin: 0;">${tech?.name || 'Não informado'}</p>
            <p style="font-size: 10px; color: #666; margin: 3px 0 0 0;">REGISTRO: ${tech?.code || '-'}</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <h2 style="font-size: 12px; font-weight: 900; text-transform: uppercase; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">Descrição do Atendimento</h2>
          <p style="font-size: 11px; font-weight: 900; color: #3b82f6; margin-bottom: 5px;">ATIVO / SERVIÇO:</p>
          <p style="font-size: 13px; font-weight: 700; margin-bottom: 15px;">${log.equipmentId ? eq?.name : log.serviceCategory}</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
            ${log.currentAmperageL1 ? `<div><p style="font-size: 9px; color: #666; margin: 0;">AMPERAGEM:</p><p style="font-size: 12px; font-weight: 900; margin: 0;">${log.currentAmperageL1}A</p></div>` : ''}
            ${log.temperature ? `<div><p style="font-size: 9px; color: #666; margin: 0;">TEMPERATURA:</p><p style="font-size: 12px; font-weight: 900; margin: 0;">${log.temperature}°C</p></div>` : ''}
          </div>

          <p style="font-size: 9px; color: #666; margin-bottom: 5px;">RELATO TÉCNICO:</p>
          <p style="font-size: 12px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${log.observations}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; text-align: center;">
          <div>
            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <p style="font-size: 10px; font-weight: 900; margin: 0;">${tech?.name}</p>
              <p style="font-size: 8px; color: #666; margin: 0;">ASSINATURA DO TÉCNICO</p>
            </div>
          </div>
          <div>
            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <p style="font-size: 10px; font-weight: 900; margin: 0;">Condomínio ${condo?.name ? condo.name.split(' ')[0] : 'Cliente'}</p>
              <p style="font-size: 8px; color: #666; margin: 0;">CIÊNCIA DO CLIENTE</p>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; text-align: center; font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 1px;">
          Documento gerado eletronicamente via sistema Company da Manutenção
        </div>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `OS_${log.id}_${condo?.name || 'Atendimento'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      alert("Erro ao gerar PDF da OS.");
    }
  };

  const handlePrint = async () => {
    if (isGeneratingPDF || logs.length === 0) return;
    setIsGeneratingPDF(true);
    const element = document.getElementById('report-content');
    if (!element) {
      setIsGeneratingPDF(false);
      return;
    }

    const opt = {
      margin: [15, 15, 20, 15],
      filename: `Relatorio_Tecnico_Condominio_${reportMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro na geração do PDF geral:", error);
      window.print();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getCondoInfo = () => {
    const activeId = !isAdmin && sessionCondoId ? sessionCondoId : parseInt(selectedCondoId);
    if (activeId.toString() === 'NaN' || activeId === 0) return { name: 'Filtro Geral', address: '-' };
    const c = condos.find(c => c.id === activeId);
    return { name: c?.name || '-', address: c?.address || '-' };
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 no-print bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <FileText className="text-blue-600 h-6 w-6" /> Gestão de Laudos Técnicos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mês de Referência</p>
            <input type="month" className="bg-transparent text-sm font-black w-full outline-none" value={reportMonth} onChange={e => setReportMonth(e.target.value)} />
          </div>

          <div className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 ${!isAdmin ? 'opacity-50' : ''}`}>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidade / Cliente</p>
            <select 
              className="bg-transparent text-sm font-black w-full outline-none disabled:cursor-not-allowed" 
              value={!isAdmin && sessionCondoId ? sessionCondoId.toString() : selectedCondoId} 
              onChange={e => setSelectedCondoId(e.target.value)}
              disabled={!isAdmin}
            >
              <option value="all">Filtro Geral</option>
              {condos.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável Técnico</p>
            <select className="bg-transparent text-sm font-black w-full outline-none" value={selectedTechId} onChange={e => setSelectedTechId(e.target.value)}>
              <option value="all">Equipe Completa</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div id="report-content" className="bg-white p-6 md:p-12 shadow-sm border border-slate-100 print:shadow-none print:border-none print:p-0">
        <div className="border-b-2 border-slate-900 pb-8 flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">Relatório Técnico de Manutenção</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Norma Brasileira NBR 10719</p>
            </div>
            <div className="md:text-right space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-900">Mês: {reportMonth}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
            <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contratante / Condomínio</h3>
                <p className="text-sm font-black text-slate-900 uppercase">{getCondoInfo().name}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase">{getCondoInfo().address}</p>
            </div>
            <div className="space-y-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objeto do Relatório</h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                  Aferição técnica de parâmetros elétricos, mecânicos e inspeção visual de ativos condominiais críticos em conformidade com as normas ABNT vigentes.
                </p>
            </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Processando Pareceres...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="mt-10 space-y-12">
            <section className="space-y-4">
                <h2 className="text-sm font-black text-slate-900 uppercase border-l-4 border-blue-600 pl-4">1. Metodologia de Inspeção</h2>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  As atividades foram executadas através de vistorias técnicas presenciais, utilizando amperímetros de alicate calibrados para aferição de corrente e termômetros infravermelhos para medição de temperatura de carcaça e barramentos. Os dados coletados foram confrontados com as especificações nominais dos fabricantes e normas de segurança elétrica.
                </p>
            </section>

            {summary && (
              <section className="space-y-4 break-inside-avoid">
                <h2 className="text-sm font-black text-slate-900 uppercase border-l-4 border-blue-600 pl-4">2. Análise e Diagnóstico Técnico</h2>
                <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 print:bg-white text-[11px] text-slate-800 space-y-4 prose-sm">
                  {summary.split('###').map((part, i) => i > 0 ? (
                    <div key={i} className="mt-4">
                        <h4 className="font-black text-blue-700 uppercase text-[10px] mb-2">{part.split('\n')[0].trim()}</h4>
                        <div className="pl-4 border-l border-slate-200">
                          {part.split('\n').slice(1).join('\n')}
                        </div>
                    </div>
                  ) : part)}
                </div>
              </section>
            )}

            <section className="space-y-6">
                <h2 className="text-sm font-black text-slate-900 uppercase border-l-4 border-blue-600 pl-4">3. Resultados das Inspeções de Campo</h2>
                <div className="space-y-6">
                    {logs.map(log => {
                        const eq = equipment.find(e => e.id === log.equipmentId);
                        const tech = technicians.find(t => t.id === log.technicianId);
                        const isAnomalous = log.anomalyDetected;

                        return (
                            <div key={log.id} className="border border-slate-100 p-6 rounded-2xl break-inside-avoid relative overflow-hidden group hover:border-blue-200 transition-all">
                                {isAnomalous && <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black px-4 py-1 uppercase tracking-widest transform translate-x-1 translate-y-2 shadow-sm">Anomalia</div>}
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${log.equipmentId ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {log.equipmentId ? <Gauge className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase">
                                                {log.equipmentId ? eq?.name : log.serviceCategory}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">{log.equipmentId ? eq?.location : 'Área Comum'}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500">{log.date.split('-').reverse().join('/')}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="text-[11px] text-slate-600 font-medium bg-slate-50 p-3 rounded-xl print:bg-white border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Parecer Individual</p>
                                        {log.observations}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {log.currentAmperageL1 ? (
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Amperagem (L1)</p>
                                                <p className={`text-xs font-black ${isAnomalous ? 'text-red-600' : 'text-blue-600'}`}>{log.currentAmperageL1}A</p>
                                            </div>
                                        ) : null}
                                        {log.temperature ? (
                                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Temperatura</p>
                                                <p className={`text-xs font-black ${isAnomalous ? 'text-red-600' : 'text-amber-600'}`}>{log.temperature}°C</p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-400 border-t border-slate-50 pt-3 no-print">
                                    <div className="flex items-center gap-1">
                                        <HardHat className="h-3 w-3" /> {tech?.name || 'Técnico'} {tech?.code && `(${tech.code})`}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleGenerateOSPDF(log)}
                                            className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Gerar PDF da OS Individual"
                                        >
                                            <FileCheck className="h-3 w-3" /> <span className="hidden md:inline">PDF OS</span>
                                        </button>
                                        <button 
                                            onClick={() => log.id && onEditLog?.(log.id)} 
                                            className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="Editar Registro"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button 
                                            onClick={() => log.id && handleDeleteLog(log.id)} 
                                            className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                            title="Excluir Registro"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="mt-20 pt-10 border-t border-slate-100 break-inside-avoid">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                    <div className="text-center space-y-2">
                        <div className="border-b border-slate-400 mx-auto w-48 h-10"></div>
                        <p className="text-[9px] font-black uppercase text-slate-900">Responsável pela Inspeção</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Técnico Certificado / CFT</p>
                    </div>
                    <div className="text-center space-y-2">
                        <div className="border-b border-slate-400 mx-auto w-48 h-10"></div>
                        <p className="text-[9px] font-black uppercase text-slate-900">Ciência do Síndico / Gestor</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Administração Condominial</p>
                    </div>
                </div>
                <div className="mt-10 text-center flex items-center justify-center gap-2 opacity-50 grayscale">
                    <Building2 className="h-4 w-4" />
                    <p className="text-[8px] font-black uppercase tracking-tighter">Company da Manutenção - Engenharia Condominial Estruturada</p>
                </div>
            </section>
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center text-slate-300">
            <FileText className="h-20 w-20 opacity-10 mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhum dado registrado para este período.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print pb-20">
        <button 
          onClick={() => {
            const info = getCondoInfo();
            const text = `Relatório Técnico ABNT - ${reportMonth}\nCondomínio: ${info.name}\nStatus: ${logs.length} registros técnicos validados.`;
            if (navigator.share) navigator.share({ title: 'Resumo do Laudo Técnico', text });
          }}
          className="bg-white border-2 border-slate-200 text-slate-800 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all"
        >
          <Share2 className="h-4 w-4" /> Compartilhar Resumo
        </button>
        <button 
          onClick={handlePrint}
          disabled={isGeneratingPDF || logs.length === 0}
          className="bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {isGeneratingPDF ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          )}
          Exportar PDF ABNT
        </button>
      </div>
    </div>
  );
};

export default Reports;
