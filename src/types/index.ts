export interface Worker {
  id: string;
  name: string;
  bengaliName?: string;
  cardNo?: string;
  phone?: string;
  designation: string; // e.g. "Plain Machine Operator"
  defaultRate?: number; // Optional, default is none
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
  pieces?: number; // কারিগরকে দেওয়া মালের পরিমাণ (পিস)
  quantity: number; // ডজনে কনভার্ট হওয়া পরিমাণ (pieces / 12)
  rate: number; // রেট (টাকা / ডজন) - ম্যানুয়ালি ইনপুট
  totalPrice: number; // quantity (DZ) * rate
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
  item: string; // মালের নাম e.g. "New York City Shirt"
  totalLotPieces?: number; // লটের মোট মালের পরিমাণ (পিস)
  totalTargetDZ?: number; // লটের মোট মালের পরিমাণ (ডজন)
  items: LotItemEntry[]; // কারিগরদের দেওয়া মালের তালিকা (পর্যায়ক্রমে যুক্ত হয়)
  totalQty: number; // মোট বিতরণকৃত ডজন
  totalPrice: number; // মোট বিল টাকা
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
