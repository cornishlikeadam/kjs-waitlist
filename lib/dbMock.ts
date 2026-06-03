import fs from 'fs';
import path from 'path';

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

// Persistent file path within workspace for reliable local mock data
const STORE_DIR = path.join(process.cwd(), 'lib');
const STORE_FILE = path.join(STORE_DIR, 'mock_db_store.json');

interface MockDbSchema {
  leads: Lead[];
  systemConfig: SystemConfig;
}

const DEFAULT_CONFIG: SystemConfig = {
  id: 'singleton',
  adminPasscode: '9938',
  activeSessions: 3,
};

function ensureStoreExists(): MockDbSchema {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    const initialData: MockDbSchema = {
      leads: [],
      systemConfig: DEFAULT_CONFIG,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const dataStr = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(dataStr) as MockDbSchema;
  } catch (error) {
    console.error('Failed to parse mock DB store file, resetting to default.', error);
    const initialData: MockDbSchema = {
      leads: [],
      systemConfig: DEFAULT_CONFIG,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveStore(data: MockDbSchema) {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to mock DB store file.', error);
  }
}

export const dbMock = {
  // Leads
  async saveLead(leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const store = ensureStoreExists();
    const newLead: Lead = {
      ...leadData,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
    };
    store.leads.push(newLead);
    saveStore(store);
    return newLead;
  },

  async getAllLeads(): Promise<Lead[]> {
    const store = ensureStoreExists();
    return store.leads;
  },

  async getLeadById(id: string): Promise<Lead | undefined> {
    const store = ensureStoreExists();
    return store.leads.find(l => l.id === id);
  },

  // SystemConfig
  async getSystemConfig(): Promise<SystemConfig> {
    const store = ensureStoreExists();
    return store.systemConfig;
  },

  async updateSystemConfig(config: Partial<Omit<SystemConfig, 'id'>>): Promise<SystemConfig> {
    const store = ensureStoreExists();
    store.systemConfig = {
      ...store.systemConfig,
      ...config,
    };
    saveStore(store);
    return store.systemConfig;
  }
};
