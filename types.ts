
export enum MaintenanceType {
  PREVENTIVE = 'Preventiva',
  CORRECTIVE = 'Corretiva',
  PREDICTIVE = 'Preditiva',
  INSPECTION = 'Vistoria/Inspeção',
  EMERGENCY = 'Emergencial'
}

export enum EquipmentType {
  PUMP = 'Bomba',
  EXHAUST = 'Exaustor',
  HEATER = 'Aquecedor',
  PANEL = 'Quadro de Comando',
  ELECTRICAL = 'Geral Elétrica',
  HYDRAULIC = 'Geral Hidráulica',
  GENSET = 'Gerador'
}

export enum ServiceCategory {
  ELECTRICAL = 'Elétrica',
  HYDRAULIC = 'Hidráulica',
  CONTROL = 'Comando/Automação',
  MECHANICAL = 'Mecânica',
  INSPECTION = 'Inspeção Normativa',
  OTHER = 'Outros'
}

export enum EquipmentStatus {
  OPERATIONAL = 'Operacional',
  WARNING = 'Alerta',
  CRITICAL = 'Crítico',
  OFFLINE = 'Fora de Serviço'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN'
}

export interface Condominium {
  id?: number;
  name: string;
  address: string;
  synced: number;
}

export interface Technician {
  id?: number;
  name: string;
  code: string;
  synced: number;
}

export interface Equipment {
  id?: number;
  condominiumId: number; // Relacionamento obrigatório
  name: string;
  type: EquipmentType;
  location: string;
  status: EquipmentStatus;
  manufacturerAmperage: number;
  maxOperatingTemp: number;
  nominalPressure?: number;
  lastMaintenanceDate?: string;
  synced: number;
}

export interface MaintenanceLog {
  id?: number;
  condominiumId: number;
  equipmentId?: number; 
  serviceCategory?: ServiceCategory;
  technicianId: number;
  date: string;
  type: MaintenanceType;
  currentAmperageL1?: number;
  currentAmperageL2?: number;
  currentAmperageL3?: number;
  temperature?: number;
  pressureBar?: number;
  observations: string;
  photoBase64?: string;
  anomalyDetected: boolean;
  synced: number;
}

export interface UserSession {
  role: UserRole;
  technician?: Technician;
  condominium?: Condominium;
}
