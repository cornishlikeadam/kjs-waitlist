import db from './db';

export interface TelemetryData {
  evadeAttempts: number;
  timeSpent: number; // in seconds
  deviceType: string;
  cursorPath?: { x: number; y: number; t: number }[];
  velocityVectors?: number[];
  [key: string]: any;
}

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  preferenceFood: string;
  preferenceVibe: string;
  qualifierAnswer: string;
  selectedDate: string; // ISO string
  telemetry: TelemetryData;
  aiPlanId?: string | null;
}

export interface SystemConfig {
  id: string;
  adminPasscode: string;
  activeSessions: number;
}

const DEFAULT_CONFIG: SystemConfig = {
  id: 'singleton',
  adminPasscode: '9938',
  activeSessions: 3,
};

export const dbMock = {
  // Leads
  async saveLead(leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const lead = await (db as any).lead.create({
      data: {
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        preferenceFood: leadData.preferenceFood,
        preferenceVibe: leadData.preferenceVibe,
        qualifierAnswer: leadData.qualifierAnswer,
        selectedDate: new Date(leadData.selectedDate),
        telemetry: leadData.telemetry as any,
        aiPlanId: leadData.aiPlanId,
      },
    });
    return {
      ...lead,
      selectedDate: lead.selectedDate.toISOString(),
      createdAt: lead.createdAt.toISOString(),
      telemetry: lead.telemetry as any,
    };
  },

  async getAllLeads(): Promise<Lead[]> {
    const leads = await (db as any).lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return leads.map((l: any) => ({
      ...l,
      selectedDate: l.selectedDate.toISOString(),
      createdAt: l.createdAt.toISOString(),
      telemetry: l.telemetry as any,
    }));
  },

  async getLeadById(id: string): Promise<Lead | undefined> {
    const l = await (db as any).lead.findUnique({
      where: { id },
    });
    if (!l) return undefined;
    return {
      ...l,
      selectedDate: l.selectedDate.toISOString(),
      createdAt: l.createdAt.toISOString(),
      telemetry: l.telemetry as any,
    };
  },

  // SystemConfig
  async getSystemConfig(): Promise<SystemConfig> {
    let config = await (db as any).systemConfig.findUnique({
      where: { id: 'singleton' },
    });
    if (!config) {
      config = await (db as any).systemConfig.create({
        data: {
          id: 'singleton',
          adminPasscode: '9938',
          activeSessions: 3,
        },
      });
    }
    return config;
  },

  async updateSystemConfig(configData: Partial<Omit<SystemConfig, 'id'>>): Promise<SystemConfig> {
    await dbMock.getSystemConfig(); // ensure singleton exists
    const config = await (db as any).systemConfig.update({
      where: { id: 'singleton' },
      data: {
        adminPasscode: configData.adminPasscode,
        activeSessions: configData.activeSessions,
      },
    });
    return config;
  }
};
