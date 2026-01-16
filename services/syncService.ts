
import { db } from '../db';
import { supabase } from '../supabase';

let isSyncing = false;

export const syncData = async () => {
  if (isSyncing) return { success: false, message: 'Já existe uma sincronização em andamento.' };
  if (!navigator.onLine) return { success: false, message: 'Sem conexão com a internet.' };

  isSyncing = true;
  console.log('Iniciando sincronização...');

  try {
    // 1. PUSH: LOCAL -> NUVEM
    
    // Sincronizar Condomínios
    try {
      const pendingCondos = await db.condominiums.where('synced').equals(0).toArray();
      for (const condo of pendingCondos) {
        const { id, synced, ...data } = condo;
        const { data: existing } = await supabase.from('condominiums').select('id').eq('name', condo.name).maybeSingle();
        if (!existing) {
          await supabase.from('condominiums').insert([data]);
        }
        await db.condominiums.update(id!, { synced: 1 });
      }
    } catch (e) { console.error('Erro ao subir condomínios:', e); }

    // Sincronizar Técnicos
    try {
      const pendingTechs = await db.technicians.where('synced').equals(0).toArray();
      for (const tech of pendingTechs) {
        const { id, synced, ...data } = tech;
        const { data: existing } = await supabase.from('technicians').select('id').eq('code', tech.code).maybeSingle();
        if (!existing) {
          await supabase.from('technicians').insert([data]);
        }
        await db.technicians.update(id!, { synced: 1 });
      }
    } catch (e) { console.error('Erro ao subir técnicos:', e); }

    // Sincronizar Equipamentos
    try {
      const pendingEq = await db.equipment.where('synced').equals(0).toArray();
      for (const eq of pendingEq) {
        const { id, synced, ...data } = eq;
        // Importante: verificar se já existe o ativo vinculado ao MESMO condomínio
        const { data: existing } = await supabase
          .from('equipment')
          .select('id')
          .eq('name', data.name)
          .eq('condominiumId', data.condominiumId)
          .maybeSingle();
          
        if (!existing) {
          await supabase.from('equipment').insert([data]);
        }
        await db.equipment.update(id!, { synced: 1 });
      }
    } catch (e) { console.error('Erro ao subir equipamentos:', e); }

    // Sincronizar Logs
    try {
      const pendingLogs = await db.logs.where('synced').equals(0).toArray();
      for (const log of pendingLogs) {
        const { id, synced, ...data } = log;
        const { error } = await supabase.from('logs').insert([data]);
        if (!error) await db.logs.update(id!, { synced: 1 });
      }
    } catch (e) { console.error('Erro ao subir logs:', e); }

    // 2. PULL: NUVEM -> LOCAL
    const pullTable = async (table: string, dbTable: any, key: string, secondaryKey?: string) => {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        if (data) {
          for (const item of data) {
            let query = dbTable.where(key).equals(item[key]);
            const exists = await query.first();
            
            if (!exists) {
              const { id, ...rest } = item;
              await dbTable.add({ ...rest, synced: 1 });
            }
          }
        }
      } catch (e) {
        console.warn(`Aviso: Tabela ${table} não pôde ser baixada. Verifique se ela existe no Supabase.`);
      }
    };

    await pullTable('condominiums', db.condominiums, 'name');
    await pullTable('technicians', db.technicians, 'code');
    await pullTable('equipment', db.equipment, 'name');

    console.log('Sincronização concluída com sucesso.');
    return { success: true };
  } catch (err) {
    console.error('Erro crítico na sincronização:', err);
    return { success: false, message: 'Erro de conexão.' };
  } finally {
    isSyncing = false;
  }
};
