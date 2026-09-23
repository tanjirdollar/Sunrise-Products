import { FactorySettings, LotInvoice, Worker } from '../types';

export const defaultFactorySettings: FactorySettings = {
  factoryName: 'Tex Wear Fashion',
  subTitle: 'Ready-Made Garments & Sewing Section',
  addressLine1: 'Mrydha Olonkar Plaza 3 rd Floor',
  addressLine2: 'Tanbazar, Narayanganj 1400',
  country: 'Bangladesh',
  billTitle: 'PCS Rate Worker Bill',
  defaultLine: 'Sweing',
  defaultDesignation: 'Plain Machine Operator',
  currency: '৳',
  phone: '',
};

// Clean slate: No default names or mock values
export const initialWorkers: Worker[] = [];

// Clean slate: No default lots or mock invoices
export const initialLots: LotInvoice[] = [];
