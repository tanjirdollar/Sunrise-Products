export interface Worker {
  id: string;
  name: string;
  bengaliName?: string;
  cardNo?: string;
  phone?: string;
  designation: string; // e.g. "Plain Machine Operator"
  defaultRate?: number;
  defaultSize?: string;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface LotItemEntry {
  id: string;
  workerId: string;
  workerName: string;
  designation: string;
  size: string;
  unit: 'DZ' | 'PCS';
  quantity: number; // e.g. 7, 5, 11.62, 20.13
  rate: number; // e.g. 246.00
  totalPrice: number; // quantity * rate
  notes?: string;
}

export interface LotInvoice {
  id: string;
  invoiceNo: string; // e.g. "2616"
  invoiceDate: string; // e.g. "2024-10-30"
  receiveDate: string; // e.g. "2024-10-30"
  line: string; // e.g. "Sweing"
  factoryUnit: string; // e.g. "Tex Wear Fashion"
  category: string; // e.g. "হাফ হাতা"
  item: string; // e.g. "New York City Shirt Hata"
  totalTargetDZ?: number; // e.g. 72.00
  items: LotItemEntry[];
  totalQty: number; // sum of item quantities
  totalPrice: number; // sum of totalPrices
  preparedBy?: string;
  checkedBy?: string;
  receivedBy?: string;
  status: 'draft' | 'completed' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface WorkerPayment {
  id: string;
  workerId: string;
  workerName: string;
  date: string;
  amount: number;
  type: 'advance' | 'salary' | 'bonus' | 'deduction';
  note?: string;
  createdAt: string;
}

export interface FactorySettings {
  factoryName: string;
  subTitle?: string;
  addressLine1: string;
  addressLine2: string;
  country: string;
  billTitle: string;
  defaultLine: string;
  defaultDesignation: string;
  currency: string;
  phone?: string;
}
