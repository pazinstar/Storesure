// ─── Fund-aware mock ledger ───────────────────────────────────────────────────
// Centralizes sample data for the 4 school sub-ledgers (funds). Replaces the
// earlier multiplier-based cosmetic scaling with real, per-fund transaction
// sets so each fund reads as an independent balanced book.

export const FUNDS = ["Tuition", "Operation", "Infrastructure", "School Fund"] as const;
export type Fund = typeof FUNDS[number];

export const FUND_COLORS: Record<string, string> = {
  Tuition: "bg-blue-100 text-blue-800 border-blue-200",
  Operation: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Infrastructure: "bg-amber-100 text-amber-800 border-amber-200",
  "School Fund": "bg-purple-100 text-purple-800 border-purple-200",
};

// ─── Cash Book row shapes ─────────────────────────────────────────────────────
export interface CashBookReceiptRow {
  date: string; recNo: string; receivedFrom: string; chqNo: string;
  cash: number; bank: number; total: number; arr: number;
  prepay: number; tenders: number; bes: number; ewc: number;
  pe: number; rmi: number; adminCosts: number; ltt: number;
  activity: number; bursary: number;
  isBalance?: boolean;
}

export interface CashBookPaymentRow {
  date: string; recNo: string; payee: string; chqNo: string;
  cash: number; bank: number; total: number; cred: number; prepay: number;
  tenders: number; bes: number; ewc: number; rmi: number;
  adminCosts: number; ltt: number; activity: number; homescience: number;
  bursary: number; advance: number;
  isBalance?: boolean;
}

// ─── Per-fund Cash Book — RECEIPTS ────────────────────────────────────────────
const RECEIPTS_TUITION: CashBookReceiptRow[] = [
  { date:"01/07/2024", recNo:"",        receivedFrom:"Opening Balances",  chqNo:"",     cash:100794, bank:6318773.34, total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"02/07/2024", recNo:"1-131",   receivedFrom:"Receipt Summaries", chqNo:"",     cash:624834, bank:0,          total:624834, arr:0,      prepay:16910,tenders:0,    bes:478432, ewc:43220,pe:47190,rmi:14027,adminCosts:13590,ltt:9750,activity:1715,bursary:0 },
  { date:"03/07/2024", recNo:"132-150", receivedFrom:"Receipt Summaries", chqNo:"",     cash:101340, bank:43170,      total:101340, arr:37595,  prepay:0,    tenders:15000,bes:5080,   ewc:495,  pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:43170 },
  { date:"03/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:43170,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"04/07/2024", recNo:"151-260", receivedFrom:"Receipt Summaries", chqNo:"",     cash:274265, bank:90575,      total:364840, arr:293472, prepay:1515, tenders:6000, bes:51488,  ewc:3915, pe:5450, rmi:1000,adminCosts:1200, ltt:600, activity:200, bursary:0 },
  { date:"04/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:268265,     total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"05/07/2024", recNo:"261-292", receivedFrom:"Receipt Summaries", chqNo:"",     cash:100720, bank:0,          total:100720, arr:85040,  prepay:0,    tenders:0,    bes:12345,  ewc:500,  pe:1370, rmi:500, adminCosts:600,  ltt:300, activity:65,  bursary:0 },
  { date:"05/07/2024", recNo:"",        receivedFrom:"Contraentry",       chqNo:"",     cash:0,      bank:100720,     total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"05/07/2024", recNo:"",        receivedFrom:"Cash Withdrawal",   chqNo:"3964", cash:130000, bank:0,          total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"08/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:19745,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"08/07/2024", recNo:"293-302", receivedFrom:"Receipt Summaries", chqNo:"",     cash:19745,  bank:29700,      total:49445,  arr:49445,  prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"10/07/2024", recNo:"303-402", receivedFrom:"Receipt Summaries", chqNo:"",     cash:248585, bank:16000,      total:264585, arr:261375, prepay:0,    tenders:0,    bes:2795,   ewc:415,  pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"10/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:248585,     total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"11/07/2024", recNo:"403-417", receivedFrom:"Receipt Summaries", chqNo:"",     cash:17600,  bank:11400,      total:29000,  arr:27000,  prepay:0,    tenders:0,    bes:2000,   ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"11/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:17600,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"15/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:8000,       total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"15/07/2024", recNo:"418-419", receivedFrom:"Receipt Summaries", chqNo:"",     cash:8000,   bank:0,          total:8000,   arr:8000,   prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"16/07/2024", recNo:"420-438", receivedFrom:"Receipt Summaries", chqNo:"",     cash:61060,  bank:10000,      total:71060,  arr:57600,  prepay:0,    tenders:0,    bes:8130,   ewc:1535, pe:1795, rmi:650, adminCosts:750,  ltt:500, activity:100, bursary:0 },
  { date:"16/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:61060,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"17/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:21530,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"17/07/2024", recNo:"439-444", receivedFrom:"Receipt Summaries", chqNo:"",     cash:21530,  bank:6500,       total:28030,  arr:11030,  prepay:0,    tenders:0,    bes:12105,  ewc:1535, pe:1795, rmi:650, adminCosts:515,  ltt:350, activity:50,  bursary:0 },
  { date:"18/07/2024", recNo:"445-447", receivedFrom:"Receipt Summaries", chqNo:"",     cash:1150,   bank:2420,       total:3570,   arr:2670,   prepay:0,    tenders:0,    bes:900,    ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"18/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:1150,       total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"22/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:30130,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"22/07/2024", recNo:"448-478", receivedFrom:"Receipt Summaries", chqNo:"",     cash:30130,  bank:23110,      total:53240,  arr:48100,  prepay:0,    tenders:0,    bes:2110,   ewc:1035, pe:745,  rmi:400, adminCosts:450,  ltt:350, activity:50,  bursary:0 },
  { date:"23/07/2024", recNo:"479-508", receivedFrom:"Receipt Summaries", chqNo:"",     cash:42685,  bank:3500,       total:46185,  arr:42785,  prepay:0,    tenders:0,    bes:3400,   ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"23/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:42685,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"24/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:20400,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"24/07/2024", recNo:"509-511", receivedFrom:"Receipt Summaries", chqNo:"",     cash:20400,  bank:0,          total:20400,  arr:5400,   prepay:0,    tenders:0,    bes:12700,  ewc:500,  pe:1050, rmi:250, adminCosts:300,  ltt:150, activity:50,  bursary:0 },
  { date:"26/07/2024", recNo:"512-524", receivedFrom:"Receipt Summaries", chqNo:"",     cash:20010,  bank:4500,       total:24510,  arr:17015,  prepay:0,    tenders:0,    bes:7495,   ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"26/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:5000,       total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"29/07/2024", recNo:"",        receivedFrom:"Cash to Bank",      chqNo:"0",    cash:0,      bank:28565,      total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0 },
  { date:"29/07/2024", recNo:"525-532", receivedFrom:"Receipt Summaries", chqNo:"",     cash:55565,  bank:0,          total:55565,  arr:1000,   prepay:0,    tenders:0,    bes:23350,  ewc:1000, pe:2100, rmi:500, adminCosts:415,  ltt:150, activity:50,  bursary:27000 },
  { date:"31/07/2024", recNo:"",        receivedFrom:"BAL C/D",           chqNo:"",     cash:0,      bank:0,          total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,   adminCosts:0,    ltt:0,   activity:0,   bursary:0, isBalance:true },
];

const RECEIPTS_OPERATION: CashBookReceiptRow[] = [
  { date:"01/07/2024", recNo:"",        receivedFrom:"Opening Balances",     chqNo:"",  cash:42150, bank:1845200, total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"02/07/2024", recNo:"OP-001",  receivedFrom:"Mess Fee Collection",  chqNo:"",  cash:185400,bank:0,       total:185400, arr:0,      prepay:0,    tenders:0,    bes:185400, ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"05/07/2024", recNo:"OP-002",  receivedFrom:"Mess Fee Collection",  chqNo:"",  cash:94250, bank:0,       total:94250,  arr:0,      prepay:0,    tenders:0,    bes:94250,  ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"08/07/2024", recNo:"",        receivedFrom:"Cash to Bank",         chqNo:"0", cash:0,     bank:240000,  total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"10/07/2024", recNo:"OP-003",  receivedFrom:"Utilities Refund",     chqNo:"",  cash:4800,  bank:0,       total:4800,   arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:4800, pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"15/07/2024", recNo:"OP-004",  receivedFrom:"Mess Fee Collection",  chqNo:"",  cash:62000, bank:15200,   total:77200,  arr:0,      prepay:0,    tenders:0,    bes:77200,  ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"22/07/2024", recNo:"OP-005",  receivedFrom:"Supplier Rebate",      chqNo:"",  cash:0,     bank:8500,    total:8500,   arr:0,      prepay:0,    tenders:0,    bes:8500,   ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"26/07/2024", recNo:"OP-006",  receivedFrom:"Mess Fee Collection",  chqNo:"",  cash:31400, bank:0,       total:31400,  arr:0,      prepay:0,    tenders:0,    bes:31400,  ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0 },
  { date:"31/07/2024", recNo:"",        receivedFrom:"BAL C/D",              chqNo:"",  cash:0,     bank:0,       total:0,      arr:0,      prepay:0,    tenders:0,    bes:0,      ewc:0,    pe:0,    rmi:0,    adminCosts:0,    ltt:0,   activity:0,    bursary:0, isBalance:true },
];

const RECEIPTS_INFRASTRUCTURE: CashBookReceiptRow[] = [
  { date:"01/07/2024", recNo:"",       receivedFrom:"Opening Balances",       chqNo:"",  cash:12400, bank:980500, total:0,     arr:0, prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:0, bursary:0 },
  { date:"04/07/2024", recNo:"IF-001", receivedFrom:"Development Fund Levy",  chqNo:"",  cash:88500, bank:0,      total:88500, arr:0, prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:88500, adminCosts:0, ltt:0, activity:0, bursary:0 },
  { date:"11/07/2024", recNo:"IF-002", receivedFrom:"Development Fund Levy",  chqNo:"",  cash:54200, bank:0,      total:54200, arr:0, prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:54200, adminCosts:0, ltt:0, activity:0, bursary:0 },
  { date:"18/07/2024", recNo:"",       receivedFrom:"Cash to Bank",           chqNo:"0", cash:0,     bank:140000, total:0,     arr:0, prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0,     adminCosts:0, ltt:0, activity:0, bursary:0 },
  { date:"24/07/2024", recNo:"IF-003", receivedFrom:"Donation – Alumni",      chqNo:"",  cash:0,     bank:25000,  total:25000, arr:0, prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:25000, adminCosts:0, ltt:0, activity:0, bursary:0 },
  { date:"31/07/2024", recNo:"",       receivedFrom:"BAL C/D",                chqNo:"",  cash:0,     bank:0,      total:0,     arr:0, prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0,     adminCosts:0, ltt:0, activity:0, bursary:0, isBalance:true },
];

const RECEIPTS_SCHOOL_FUND: CashBookReceiptRow[] = [
  { date:"01/07/2024", recNo:"",       receivedFrom:"Opening Balances",     chqNo:"",  cash:18600, bank:1240000, total:0,     arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:0, bursary:0 },
  { date:"03/07/2024", recNo:"SF-001", receivedFrom:"Activity Fee",         chqNo:"",  cash:72300, bank:0,       total:72300, arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:72300,bursary:0 },
  { date:"05/07/2024", recNo:"SF-002", receivedFrom:"Capitation Grant",     chqNo:"CG-882",cash:0, bank:320000,  total:320000,arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:320000,bursary:0 },
  { date:"10/07/2024", recNo:"SF-003", receivedFrom:"Bursary Disbursement", chqNo:"",  cash:0,     bank:48500,   total:48500, arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:0,    bursary:48500 },
  { date:"17/07/2024", recNo:"SF-004", receivedFrom:"Activity Fee",         chqNo:"",  cash:24500, bank:0,       total:24500, arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:24500,bursary:0 },
  { date:"23/07/2024", recNo:"",       receivedFrom:"Cash to Bank",         chqNo:"0", cash:0,     bank:96800,   total:0,     arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:0,    bursary:0 },
  { date:"31/07/2024", recNo:"",       receivedFrom:"BAL C/D",              chqNo:"",  cash:0,     bank:0,       total:0,     arr:0,     prepay:0, tenders:0, bes:0, ewc:0, pe:0, rmi:0, adminCosts:0, ltt:0, activity:0,    bursary:0, isBalance:true },
];

// ─── Per-fund Cash Book — PAYMENTS ────────────────────────────────────────────
const PAYMENTS_TUITION: CashBookPaymentRow[] = [
  { date:"01/07/2024", recNo:"",   payee:"Opening Balances",             chqNo:"",            cash:0,     bank:0,         total:0,      cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:0,    ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"02/07/2024", recNo:"1",  payee:"Stationery Supplies",          chqNo:"",            cash:8250,  bank:0,         total:8250,   cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:8250, ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"02/07/2024", recNo:"",   payee:"Prepayments",                  chqNo:"",            cash:624834,bank:0,         total:624834, cred:0,    prepay:624834,tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:0,    ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"03/07/2024", recNo:"2",  payee:"Textbook Suppliers",           chqNo:"3985",        cash:0,     bank:45250,     total:45250,  cred:45250,prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:0,    ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"04/07/2024", recNo:"3",  payee:"Exam Papers – KCSE Prep",      chqNo:"",            cash:5000,  bank:0,         total:5000,   cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:5000, ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"17/07/2024", recNo:"4",  payee:"Teacher Training Workshop",    chqNo:"3986",        cash:0,     bank:42500,     total:42500,  cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:42500,ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"18/07/2024", recNo:"5",  payee:"Library Resources",            chqNo:"",            cash:15184, bank:0,         total:15184,  cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:0,    ltt:0,   activity:0,    homescience:15184,bursary:0,  advance:0 },
  { date:"22/07/2024", recNo:"6",  payee:"Printing Services",            chqNo:"",            cash:4000,  bank:0,         total:4000,   cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:4000, ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"30/07/2024", recNo:"7",  payee:"BOM Members Allowances",       chqNo:"",            cash:25000, bank:0,         total:25000,  cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:25000,ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"31/07/2024", recNo:"8",  payee:"Bursary Beneficiary",          chqNo:"",            cash:70170, bank:0,         total:70170,  cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:0,    ltt:0,   activity:0,    homescience:0,  bursary:70170,advance:0 },
  { date:"31/07/2024", recNo:"",   payee:"Bank charges",                 chqNo:"",            cash:0,     bank:2076,      total:2076,   cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:2076, adminCosts:0,    ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0 },
  { date:"31/07/2024", recNo:"",   payee:"BAL C/D",                      chqNo:"",            cash:1125975,bank:6547387.34,total:0,     cred:0,    prepay:0,     tenders:0,    bes:0,    ewc:0,   rmi:0,    adminCosts:0,    ltt:0,   activity:0,    homescience:0,  bursary:0,    advance:0, isBalance:true },
];

const PAYMENTS_OPERATION: CashBookPaymentRow[] = [
  { date:"01/07/2024", recNo:"",    payee:"Opening Balances",           chqNo:"",    cash:0,     bank:0,      total:0,      cred:0,    prepay:0, tenders:0, bes:0,      ewc:0,    rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"01/07/2024", recNo:"OP1", payee:"Waecomatt Supermarket",      chqNo:"",    cash:826,   bank:0,      total:826,    cred:0,    prepay:0, tenders:0, bes:826,    ewc:0,    rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"03/07/2024", recNo:"OP2", payee:"Josphat Kyalo (Cook Wages)", chqNo:"",    cash:3500,  bank:0,      total:3500,   cred:0,    prepay:0, tenders:0, bes:3500,   ewc:0,    rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"03/07/2024", recNo:"OP3", payee:"Qpower Venture (Electric)",  chqNo:"",    cash:4500,  bank:0,      total:4500,   cred:0,    prepay:0, tenders:0, bes:0,      ewc:4500, rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"05/07/2024", recNo:"OP4", payee:"Mlangoni Farm Tools",        chqNo:"",    cash:2600,  bank:0,      total:2600,   cred:0,    prepay:0, tenders:0, bes:2600,   ewc:0,    rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"10/07/2024", recNo:"OP5", payee:"Mazingira Timber & Hardware",chqNo:"",    cash:1600,  bank:0,      total:1600,   cred:0,    prepay:0, tenders:0, bes:1600,   ewc:0,    rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"18/07/2024", recNo:"OP6", payee:"Kithimani General Shop",     chqNo:"",    cash:3325,  bank:0,      total:3325,   cred:0,    prepay:0, tenders:0, bes:0,      ewc:225,  rmi:0,   adminCosts:3100,ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"26/07/2024", recNo:"OP7", payee:"Daniel Ndolo (Supplies)",    chqNo:"",    cash:7372,  bank:0,      total:7372,   cred:0,    prepay:0, tenders:0, bes:6872,   ewc:0,    rmi:0,   adminCosts:500, ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"29/07/2024", recNo:"OP8", payee:"Catherine Nzomo (Kitchen)",  chqNo:"",    cash:3010,  bank:0,      total:3010,   cred:0,    prepay:0, tenders:0, bes:2410,   ewc:0,    rmi:0,   adminCosts:600, ltt:0,   activity:0, homescience:0, bursary:0, advance:0 },
  { date:"31/07/2024", recNo:"",    payee:"BAL C/D",                    chqNo:"",    cash:392417,bank:2108900,total:0,      cred:0,    prepay:0, tenders:0, bes:0,      ewc:0,    rmi:0,   adminCosts:0,   ltt:0,   activity:0, homescience:0, bursary:0, advance:0, isBalance:true },
];

const PAYMENTS_INFRASTRUCTURE: CashBookPaymentRow[] = [
  { date:"01/07/2024", recNo:"",    payee:"Opening Balances",             chqNo:"",    cash:0,    bank:0,      total:0,     cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0,    adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"02/07/2024", recNo:"IF1", payee:"House Rent (Worker Quarters)",chqNo:"",    cash:1300, bank:0,      total:1300,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:1300, adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"05/07/2024", recNo:"IF2", payee:"Naivas Limited (Fittings)",   chqNo:"",    cash:2740, bank:0,      total:2740,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:2740, adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"05/07/2024", recNo:"IF3", payee:"Sylivia Kisilu (Plumbing)",   chqNo:"",    cash:1500, bank:0,      total:1500,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:1500, adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"05/07/2024", recNo:"IF4", payee:"Airtime Subsidy (Site)",      chqNo:"",    cash:14650,bank:0,      total:14650, cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:14650,adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"17/07/2024", recNo:"IF5", payee:"Stedan Hardware",             chqNo:"3988",cash:0,    bank:45250,  total:45250, cred:45250,prepay:0,tenders:0, bes:0, ewc:0, rmi:0,    adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"18/07/2024", recNo:"IF6", payee:"Sylivia Kisilu (Repairs)",    chqNo:"",    cash:1500, bank:0,      total:1500,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:1500, adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"19/07/2024", recNo:"IF7", payee:"Agnetta Musyoka (Painting)",  chqNo:"",    cash:1000, bank:0,      total:1000,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:1000, adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"27/07/2024", recNo:"IF8", payee:"TPAD Appraisal (Site)",       chqNo:"",    cash:2000, bank:0,      total:2000,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:2000, adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0 },
  { date:"31/07/2024", recNo:"",    payee:"BAL C/D",                     chqNo:"",    cash:132410,bank:1100250,total:0,    cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0,    adminCosts:0, ltt:0, activity:0, homescience:0, bursary:0, advance:0, isBalance:true },
];

const PAYMENTS_SCHOOL_FUND: CashBookPaymentRow[] = [
  { date:"01/07/2024", recNo:"",    payee:"Opening Balances",                chqNo:"", cash:0,    bank:0,      total:0,     cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:0, ltt:0,    activity:0,    homescience:0, bursary:0,   advance:0 },
  { date:"02/07/2024", recNo:"SF1", payee:"Mrs. Martin Kyalo (Trip)",        chqNo:"", cash:2500, bank:0,      total:2500,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:0, ltt:2500, activity:0,    homescience:0, bursary:0,   advance:0 },
  { date:"06/07/2024", recNo:"SF2", payee:"Music Festival Competition",     chqNo:"", cash:23400,bank:0,      total:23400, cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:0, ltt:0,    activity:23400,homescience:0, bursary:0,   advance:0 },
  { date:"10/07/2024", recNo:"SF3", payee:"Gabriel Mulela (Drama)",         chqNo:"", cash:2500, bank:0,      total:2500,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:1500,ltt:1000, activity:0,    homescience:0, bursary:0,   advance:0 },
  { date:"14/07/2024", recNo:"SF4", payee:"YCS Formation & Enrolment",      chqNo:"", cash:5695, bank:0,      total:5695,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:5695,ltt:0,    activity:0,    homescience:0, bursary:0,   advance:0 },
  { date:"18/07/2024", recNo:"SF5", payee:"Muia P Nzuki (Advance)",         chqNo:"", cash:5000, bank:0,      total:5000,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:0, ltt:0,    activity:0,    homescience:0, bursary:0,   advance:5000 },
  { date:"26/07/2024", recNo:"SF6", payee:"Martha Kwamboka (Sports)",       chqNo:"", cash:1110, bank:0,      total:1110,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:810, ltt:300,  activity:0,    homescience:0, bursary:0,   advance:0 },
  { date:"31/07/2024", recNo:"SF7", payee:"Jovicah General Shop (Prizes)",  chqNo:"", cash:4980, bank:0,      total:4980,  cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:4780,ltt:200,  activity:0,    homescience:0, bursary:0,   advance:0 },
  { date:"31/07/2024", recNo:"",    payee:"BAL C/D",                        chqNo:"", cash:70215,bank:1729300,total:0,     cred:0, prepay:0, tenders:0, bes:0, ewc:0, rmi:0, adminCosts:0, ltt:0,    activity:0,    homescience:0, bursary:0,   advance:0, isBalance:true },
];

const RECEIPTS_BY_FUND: Record<string, CashBookReceiptRow[]> = {
  Tuition: RECEIPTS_TUITION,
  Operation: RECEIPTS_OPERATION,
  Infrastructure: RECEIPTS_INFRASTRUCTURE,
  "School Fund": RECEIPTS_SCHOOL_FUND,
};

const PAYMENTS_BY_FUND: Record<string, CashBookPaymentRow[]> = {
  Tuition: PAYMENTS_TUITION,
  Operation: PAYMENTS_OPERATION,
  Infrastructure: PAYMENTS_INFRASTRUCTURE,
  "School Fund": PAYMENTS_SCHOOL_FUND,
};

// ─── Cash Book aggregation helpers ────────────────────────────────────────────
const RECEIPT_NUMERIC_KEYS: (keyof CashBookReceiptRow)[] = [
  "cash","bank","total","arr","prepay","tenders","bes","ewc","pe","rmi","adminCosts","ltt","activity","bursary",
];
const PAYMENT_NUMERIC_KEYS: (keyof CashBookPaymentRow)[] = [
  "cash","bank","total","cred","prepay","tenders","bes","ewc","rmi","adminCosts","ltt","activity","homescience","bursary","advance",
];

export function getCashBookReceipts(fund: string): CashBookReceiptRow[] {
  return RECEIPTS_BY_FUND[fund] ?? [];
}

export function getCashBookPayments(fund: string): CashBookPaymentRow[] {
  return PAYMENTS_BY_FUND[fund] ?? [];
}

export function getCashBookReceiptsTotals(fund: string): CashBookReceiptRow {
  const rows = getCashBookReceipts(fund).filter(r => !r.isBalance && !r.receivedFrom.toLowerCase().includes("opening"));
  const t: any = { date:"", recNo:"", receivedFrom:"TOTALS", chqNo:"" };
  for (const k of RECEIPT_NUMERIC_KEYS) t[k] = rows.reduce((s, r) => s + (r[k] as number), 0);
  return t as CashBookReceiptRow;
}

export function getCashBookPaymentsTotals(fund: string): CashBookPaymentRow {
  const rows = getCashBookPayments(fund).filter(r => !r.isBalance && !r.payee.toLowerCase().includes("opening"));
  const t: any = { date:"", recNo:"", payee:"TOTALS", chqNo:"" };
  for (const k of PAYMENT_NUMERIC_KEYS) t[k] = rows.reduce((s, r) => s + (r[k] as number), 0);
  return t as CashBookPaymentRow;
}

// ─── Per-fund Trial Balance ───────────────────────────────────────────────────
export interface TrialBalanceRow { code: string; name: string; debit: number; credit: number; }

// Inter-fund pairs (kept in sync across the 4 TBs):
//   Tuition has Due from Operation 420,000   ↔ Operation has Due to Tuition 420,000
//   Tuition has Due from School Fund 475,000 ↔ School Fund has Due to Tuition 475,000
//   Operation has Due from Infrastructure 388,000 ↔ Infrastructure has Due to Operation 388,000

const TB_TUITION: TrialBalanceRow[] = [
  { code: "1100", name: "Cash on Hand",                  debit: 50000,    credit: 0 },
  { code: "1201", name: "Cash at Bank – Tuition A/C",    debit: 1820000,  credit: 0 },
  { code: "1300", name: "Student Debtors – Tuition",     debit: 2390000,  credit: 0 },
  { code: "5100", name: "Staff Salaries",                debit: 7560000,  credit: 0 },
  { code: "5400", name: "Stationery & Textbooks",        debit: 285000,   credit: 0 },
  { code: "9100", name: "Due from Operation Fund",       debit: 420000,   credit: 0 },
  { code: "9110", name: "Due from School Fund",          debit: 475000,   credit: 0 },
  { code: "4100", name: "Tuition Fees Income",           debit: 0,        credit: 5400000 },
  { code: "4110", name: "Boarding Fees Income",          debit: 0,        credit: 7600000 },
];
// Tuition totals: Dr 13,000,000  =  Cr 13,000,000

const TB_OPERATION: TrialBalanceRow[] = [
  { code: "1102", name: "Cash at Bank – Operation A/C",  debit: 680000,   credit: 0 },
  { code: "1400", name: "Inventory – Stores",            debit: 485000,   credit: 0 },
  { code: "5200", name: "Food Supplies & Catering",      debit: 1850000,  credit: 0 },
  { code: "5250", name: "Kitchen Staff Wages",           debit: 985000,   credit: 0 },
  { code: "5300", name: "Utilities (Electricity, Water)",debit: 612000,   credit: 0 },
  { code: "9300", name: "Due from Infrastructure Fund",  debit: 388000,   credit: 0 },
  { code: "2100", name: "Accounts Payable – Suppliers",  debit: 0,        credit: 418000 },
  { code: "3102", name: "Accumulated Fund – Operation",  debit: 0,        credit: 100000 },
  { code: "4200", name: "Mess Fee Income",               debit: 0,        credit: 4000000 },
  { code: "4210", name: "Supplier Rebates",              debit: 0,        credit: 62000 },
  { code: "9101", name: "Due to Tuition Fund",           debit: 0,        credit: 420000 },
];
// Operation totals: Dr 5,000,000  =  Cr 5,000,000

const TB_INFRASTRUCTURE: TrialBalanceRow[] = [
  { code: "1103", name: "Cash at Bank – Infrastructure", debit: 980500,   credit: 0 },
  { code: "1500", name: "PPE – Cost",                    debit: 23625000, credit: 0 },
  { code: "5500", name: "Repairs & Maintenance",         debit: 420000,   credit: 0 },
  { code: "6100", name: "Depreciation Expense",          debit: 1200000,  credit: 0 },
  { code: "1501", name: "Accumulated Depreciation",      debit: 0,        credit: 5607500 },
  { code: "3103", name: "Accumulated Fund – Infrastructure", debit: 0,    credit: 18230000 },
  { code: "4300", name: "Development Fund Levy Income",  debit: 0,        credit: 1680000 },
  { code: "4310", name: "Donation – Alumni",             debit: 0,        credit: 320000 },
  { code: "9301", name: "Due to Operation Fund",         debit: 0,        credit: 388000 },
];
// Infrastructure totals: Dr 26,225,500  =  Cr 26,225,500

const TB_SCHOOL_FUND: TrialBalanceRow[] = [
  { code: "1104", name: "Cash at Bank – School Fund",    debit: 1240000,  credit: 0 },
  { code: "5600", name: "Sports & Games",                debit: 215000,   credit: 0 },
  { code: "5700", name: "Music & Drama",                 debit: 95000,    credit: 0 },
  { code: "5800", name: "Bursary Disbursements",         debit: 290000,   credit: 0 },
  { code: "9500", name: "Other Program Expenses",        debit: 296500,   credit: 0 },
  { code: "3104", name: "Accumulated Fund – School Fund",debit: 0,        credit: 99500 },
  { code: "4400", name: "Activity Fee Income",           debit: 0,        credit: 540000 },
  { code: "4410", name: "Capitation & Government Grants",debit: 0,        credit: 960000 },
  { code: "4420", name: "Other Income (Interest, etc.)", debit: 0,        credit: 62000 },
  { code: "9111", name: "Due to Tuition Fund",           debit: 0,        credit: 475000 },
];
// School Fund totals: Dr 2,136,500  =  Cr 2,136,500

const TRIAL_BALANCE_BY_FUND: Record<string, TrialBalanceRow[]> = {
  Tuition: TB_TUITION,
  Operation: TB_OPERATION,
  Infrastructure: TB_INFRASTRUCTURE,
  "School Fund": TB_SCHOOL_FUND,
};

export function getTrialBalance(fund: string): TrialBalanceRow[] {
  return TRIAL_BALANCE_BY_FUND[fund] ?? [];
}

export function getTrialBalanceTotals(fund: string): { debit: number; credit: number } {
  const rows = getTrialBalance(fund);
  return {
    debit: rows.reduce((s, r) => s + r.debit, 0),
    credit: rows.reduce((s, r) => s + r.credit, 0),
  };
}
