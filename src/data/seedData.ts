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
  phone: '01712345678',
};

// 50 Demo Garments Workers with Bangladeshi Names & Operator Cards
const bengaliNamesList = [
  'Md. Ruhul Amin', 'Md. Al-Amin', 'Md. Selim Reza', 'Md. Jahangir Hossain', 'Md. Kabir Hossain',
  'Md. Shakil Ahmed', 'Md. Faruk Hossain', 'Md. Billal Hossain', 'Md. Saiful Islam', 'Md. Rubel Hossain',
  'Md. Sohel Rana', 'Md. Monir Hossain', 'Md. Nasir Uddin', 'Md. Mizanur Rahman', 'Md. Rafiqul Islam',
  'Md. Anowar Hossain', 'Md. Asadul Islam', 'Md. Shah Alam', 'Md. Dulal Hossain', 'Md. Liton Mia',
  'Md. Ripon Mia', 'Md. Rasel Mia', 'Md. Shahin Alam', 'Md. Kamrul Hasan', 'Md. Abu Bakar',
  'Md. Ismail Hossain', 'Md. Ibrahim Khalil', 'Md. Ashraful Islam', 'Md. Tarikul Islam', 'Md. Shariful Islam',
  'Md. Zahidul Islam', 'Md. Emdadul Haque', 'Md. Shamsul Haque', 'Md. Abdul Barek', 'Md. Mostafa Kamal',
  'Md. Nurul Islam', 'Md. Joynal Abedin', 'Md. Mahabub Alam', 'Md. Harun Ur Rashid', 'Md. Sirajul Islam',
  'Md. Delwar Hossain', 'Md. Masud Rana', 'Md. Rashedul Islam', 'Md. Ziaur Rahman', 'Md. Habibur Rahman',
  'Md. Shafiul Alam', 'Md. Aminul Islam', 'Md. Babul Mia', 'Md. Sumon Mia', 'Md. Rakibul Hasan'
];

const designationsList = [
  'Plain Machine Operator',
  'Overlock Operator',
  'Flatlock Operator',
  'Kansai Operator',
  'Feed Off the Arm Operator',
  'Button Stitch Operator',
  'Bar Tack Operator',
  'Sewing Helper',
];

const sizesList = ['14/20', '22/28', '30/36', 'S/M', 'L/XL'];

export const demoWorkers: Worker[] = bengaliNamesList.map((name, index) => {
  const num = index + 1;
  return {
    id: `worker-demo-${String(num).padStart(2, '0')}`,
    name,
    cardNo: `OP-${String(num).padStart(2, '0')}`,
    phone: `017${String(10000000 + num * 137).slice(0, 8)}`,
    designation: designationsList[index % designationsList.length],
    defaultSize: sizesList[index % sizesList.length],
    active: true,
    createdAt: new Date(Date.now() - (50 - index) * 3600000 * 24).toISOString(),
  };
});

// Demo Lot with 32 Workers to ensure at least 30 workers appear on the first page!
const demoLotItems = demoWorkers.slice(0, 32).map((w, index) => {
  // Standard pieces in garments piece rate (60, 72, 84, 96, 120, etc.)
  const pieces = 60 + ((index * 12) % 60); // 60, 72, 84, 96, 108
  const qtyDZ = Math.round((pieces / 12) * 100) / 100;
  const rate = 240 + ((index * 5) % 30); // Manual rate 240-265 Tk/DZ
  const totalPrice = Math.round(qtyDZ * rate * 100) / 100;

  return {
    id: `item-demo-${index + 1}`,
    workerId: w.id,
    workerName: w.name,
    designation: w.designation,
    size: w.defaultSize || '14/20',
    unit: 'DZ' as const,
    pieces,
    quantity: qtyDZ,
    rate,
    totalPrice,
  };
});

const totalDemoDZ = demoLotItems.reduce((s, i) => s + i.quantity, 0);
const totalDemoPieces = demoLotItems.reduce((s, i) => s + (i.pieces || 0), 0);
const totalDemoPrice = demoLotItems.reduce((s, i) => s + i.totalPrice, 0);

export const demoLots: LotInvoice[] = [
  {
    id: 'lot-demo-2616',
    invoiceNo: '2616',
    invoiceDate: '2024-10-30',
    receiveDate: '2024-10-30',
    line: 'Sweing',
    factoryUnit: 'Tex Wear Fashion',
    category: 'হাফ হাতা',
    item: 'New York City Shirt (Half Sleeve)',
    totalLotPieces: 2400,
    totalTargetDZ: 200.00,
    items: demoLotItems,
    totalQty: Math.round(totalDemoDZ * 100) / 100,
    totalPrice: Math.round(totalDemoPrice * 100) / 100,
    preparedBy: 'Production Incharge',
    checkedBy: 'Sweing Supervisor',
    receivedBy: 'Factory Admin',
    status: 'completed',
    createdAt: '2024-10-30T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  }
];

// Clean empty slate constants
export const initialWorkers: Worker[] = demoWorkers;
export const initialLots: LotInvoice[] = demoLots;
