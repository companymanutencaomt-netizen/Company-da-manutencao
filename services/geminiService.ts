
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MaintenanceLog, Equipment } from "../types";

/**
 * Analisa o estado de um equipamento com base no histórico de manutenção usando IA.
 * Utiliza o modelo Gemini 3 Pro para raciocínio complexo sobre conformidade técnica.
 */
export async function analyzeMaintenance(equipment: Equipment, logs: MaintenanceLog[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const historyText = logs.map(l => 
    `Data: ${l.date}, Amperagem: ${l.currentAmperageL1 || 'N/A'}A, Temp: ${l.temperature || 'N/A'}°C, Obs: ${l.observations}`
  ).join('\n');

  const prompt = `
    Como engenheiro de manutenção experiente, analise os dados técnicos do equipamento:
    Ativo: ${equipment.name} (${equipment.type})
    Nominais: ${equipment.manufacturerAmperage}A, Temp Máx: ${equipment.maxOperatingTemp}°C
    
    Histórico Recente de Inspeção:
    ${historyText}

    Forneça um parecer de engenharia rigoroso:
    1. Diagnóstico preciso do estado de conservação.
    2. Alertas sobre tendências de falha baseadas em amperagem ou temperatura.
    3. Plano de ação corretiva ou preventiva imediata.
    Mantenha o tom profissional e técnico.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 1500,
        thinkingConfig: { thinkingBudget: 512 }
      }
    });
    return response.text || "Análise técnica indisponível para este ativo.";
  } catch (error) {
    console.error("Erro ao analisar com Gemini:", error);
    return "Falha na comunicação com o motor de IA. Verifique os dados locais.";
  }
}

/**
 * Gera um resumo mensal das atividades de manutenção.
 * Utiliza o modelo Gemini 3 Flash para tarefas de sumarização rápida.
 */
export async function generateMonthlyReportSummary(month: string, equipmentList: Equipment[], logs: MaintenanceLog[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const activities = logs.map(l => {
    const eq = equipmentList.find(e => e.id === l.equipmentId);
    return `- ${l.date}: [${l.type}] ${eq ? `Equip: ${eq.name}` : `Reparo: ${l.serviceCategory}`} - ${l.observations}`;
  }).join('\n');

  const prompt = `
    Atue como Gestor de Engenharia Gerencial. Resuma as atividades de manutenção do mês ${month}.
    Log de Atividades:
    ${activities}

    Sua resposta deve ser um laudo executivo estruturado em Markdown:
    ### 1. PANORAMA OPERACIONAL MENSAL
    ### 2. PRINCIPAIS INTERVENÇÕES E CONFORMIDADE
    ### 3. RECOMENDAÇÕES ESTRATÉGICAS DE PRESERVAÇÃO
    
    Seja conciso, focado em segurança predial e preservação de ativos.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Sem dados suficientes para gerar o resumo mensal.";
  } catch (error) {
    console.error("Erro ao gerar resumo com Gemini:", error);
    return "Aguardando processamento do laudo mensal.";
  }
}
