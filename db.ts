
// Importando Dexie como exportação padrão para garantir que a classe e seus métodos sejam corretamente reconhecidos pelo TypeScript
import Dexie from 'dexie';
import type { Table } from 'dexie';
import { Equipment, MaintenanceLog, Technician, Condominium, EquipmentType, EquipmentStatus } from './types';

/**
 * Banco de dados local utilizando Dexie (IndexedDB) para suporte offline total.
 * Mantém registros de equipamentos, logs de manutenção, técnicos e condomínios.
 */
export class CondoDB extends Dexie {
  equipment!: Table<Equipment>;
  logs!: Table<MaintenanceLog>;
  technicians!: Table<Technician>;
  condominiums!: Table<Condominium>;

  constructor() {
    super('CondoMaintainDB');
    // Versão 9: Estrutura de índices para busca e filtragem otimizada
    // O método 'version' é herdado da classe Dexie. O uso do import padrão resolve problemas de tipagem em algumas versões.
    this.version(9).stores({
      equipment: '++id, condominiumId, name, type, status, location, synced',
      logs: '++id, condominiumId, equipmentId, technicianId, date, synced',
      technicians: '++id, name, code, synced',
      condominiums: '++id, name, synced'
    });
  }
}

export const db = new CondoDB();

/**
 * Popula o banco de dados com dados iniciais de demonstração (semente).
 */
export async function seedDatabase() {
  try {
    const techCount = await db.technicians.count();
    if (techCount === 0) {
      await db.technicians.add({ name: 'Eng. Técnico Resp.', code: 'CFT-99887-SP', synced: 0 });
    }
    
    const condoCount = await db.condominiums.count();
    let condoId: number;
    if (condoCount === 0) {
      condoId = await db.condominiums.add({ name: 'Residencial Aurora', address: 'Av. Paulista, 1000', synced: 0 }) as number;
    } else {
      const firstCondo = await db.condominiums.toCollection().first();
      condoId = firstCondo?.id || 1;
    }

    const equipCount = await db.equipment.count();
    if (equipCount === 0) {
      await db.equipment.bulkAdd([
        {
          condominiumId: condoId,
          name: 'Bomba Recalque 01',
          type: EquipmentType.PUMP,
          status: EquipmentStatus.OPERATIONAL,
          location: 'Subsolo -1',
          manufacturerAmperage: 12.5,
          maxOperatingTemp: 65,
          nominalPressure: 4.5,
          synced: 0
        },
        {
          condominiumId: condoId,
          name: 'Quadro Comando Geral',
          type: EquipmentType.PANEL,
          status: EquipmentStatus.WARNING,
          location: 'Sala Elétrica Térreo',
          manufacturerAmperage: 80.0,
          maxOperatingTemp: 45,
          synced: 0
        }
      ]);
    }
  } catch (err) {
    console.error("Erro no seeding do banco:", err);
  }
}

seedDatabase();
