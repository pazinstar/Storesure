import { useState } from "react";
import { Plus, Search, Pencil, ToggleLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

type AccountClass = "Asset" | "Liability" | "Equity" | "Revenue" | "Expense" | "Stores Consumption";

interface Account {
  id: number;
  code: string;
  name: string;
  class: AccountClass;
  type: string;
  description: string;
  active: boolean;
}

const INITIAL_ACCOUNTS: Account[] = [
  // ── ASSETS ──────────────────────────────────────────────────────────────────
  // Cash and Cash Equivalents
  { id: 1,   code: "11101", name: "Bank – Tuition Account",                    class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 2,   code: "11102", name: "Bank – Operations Account",                 class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 3,   code: "11103", name: "Bank – Infrastructure Account",             class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 4,   code: "11104", name: "Bank – School Fund / Boarding",             class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 5,   code: "11105", name: "Bank – Income Generating Activities",       class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 6,   code: "11106", name: "Bank – PA Development Account",             class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 7,   code: "11107", name: "Savings Account",                           class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 8,   code: "11110", name: "Cash in Hand",                              class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  { id: 9,   code: "11111", name: "Mobile Money",                              class: "Asset",            type: "Cash and Cash Equivalents",    description: "", active: true },
  // Short Term Investments
  { id: 10,  code: "11201", name: "Fixed Deposits",                            class: "Asset",            type: "Short Term Investments",       description: "", active: true },
  { id: 11,  code: "11202", name: "Treasury Bills",                            class: "Asset",            type: "Short Term Investments",       description: "", active: true },
  { id: 12,  code: "11203", name: "Treasury Bonds",                            class: "Asset",            type: "Short Term Investments",       description: "", active: true },
  { id: 13,  code: "11204", name: "Cooperative Shares",                        class: "Asset",            type: "Short Term Investments",       description: "", active: true },
  // Accounts Receivable
  { id: 14,  code: "11301", name: "Fee Arrears",                               class: "Asset",            type: "Accounts Receivable",          description: "", active: true },
  { id: 15,  code: "11302", name: "Other Non-Fee Receivables",                 class: "Asset",            type: "Accounts Receivable",          description: "", active: true },
  { id: 16,  code: "11303", name: "Salary Advances",                           class: "Asset",            type: "Accounts Receivable",          description: "", active: true },
  { id: 17,  code: "11304", name: "Imprest Outstanding",                       class: "Asset",            type: "Accounts Receivable",          description: "", active: true },
  { id: 18,  code: "11305", name: "Rent Receivable",                           class: "Asset",            type: "Accounts Receivable",          description: "", active: true },
  { id: 19,  code: "11306", name: "Staff Debtors",                             class: "Asset",            type: "Accounts Receivable",          description: "", active: true },
  // Inventories (Stores)
  { id: 20,  code: "11401", name: "Food Stores",                               class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  { id: 21,  code: "11402", name: "Stationery Stores",                         class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  { id: 22,  code: "11403", name: "Laboratory Stores",                         class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  { id: 23,  code: "11404", name: "Electrical Stores",                         class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  { id: 24,  code: "11405", name: "Cleaning Materials",                        class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  { id: 25,  code: "11406", name: "Medical Supplies",                          class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  { id: 26,  code: "11407", name: "Maintenance Stores",                        class: "Asset",            type: "Inventories (Stores)",         description: "", active: true },
  // Prepayments
  { id: 27,  code: "11501", name: "Insurance Prepaid",                         class: "Asset",            type: "Prepayments",                  description: "", active: true },
  { id: 28,  code: "11502", name: "Rent Prepaid",                              class: "Asset",            type: "Prepayments",                  description: "", active: true },
  { id: 29,  code: "11503", name: "Supplier Deposits",                         class: "Asset",            type: "Prepayments",                  description: "", active: true },
  // Property, Plant and Equipment
  { id: 30,  code: "12101", name: "Land",                                      class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 31,  code: "12102", name: "Buildings",                                 class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 32,  code: "12103", name: "Furniture and Fittings",                    class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 33,  code: "12104", name: "Motor Vehicles",                            class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 34,  code: "12105", name: "Laboratory Equipment",                      class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 35,  code: "12106", name: "ICT Equipment",                             class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 36,  code: "12107", name: "Kitchen Equipment",                         class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 37,  code: "12108", name: "Solar Systems",                             class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  { id: 38,  code: "12109", name: "Water Systems",                             class: "Asset",            type: "Property, Plant and Equipment",description: "", active: true },
  // Accumulated Depreciation
  { id: 39,  code: "12201", name: "Accumulated Depreciation – Buildings",      class: "Asset",            type: "Accumulated Depreciation",     description: "", active: true },
  { id: 40,  code: "12202", name: "Accumulated Depreciation – Furniture",      class: "Asset",            type: "Accumulated Depreciation",     description: "", active: true },
  { id: 41,  code: "12203", name: "Accumulated Depreciation – Vehicles",       class: "Asset",            type: "Accumulated Depreciation",     description: "", active: true },
  { id: 42,  code: "12204", name: "Accumulated Depreciation – Equipment",      class: "Asset",            type: "Accumulated Depreciation",     description: "", active: true },
  { id: 43,  code: "12205", name: "Accumulated Depreciation – Solar Systems",  class: "Asset",            type: "Accumulated Depreciation",     description: "", active: true },
  // Biological Assets
  { id: 44,  code: "12301", name: "Cattle",                                    class: "Asset",            type: "Biological Assets",            description: "", active: true },
  { id: 45,  code: "12302", name: "Poultry",                                   class: "Asset",            type: "Biological Assets",            description: "", active: true },
  { id: 46,  code: "12303", name: "Trees",                                     class: "Asset",            type: "Biological Assets",            description: "", active: true },
  { id: 47,  code: "12304", name: "Crops",                                     class: "Asset",            type: "Biological Assets",            description: "", active: true },
  // Long Term Investments
  { id: 48,  code: "12401", name: "Treasury Bonds",                            class: "Asset",            type: "Long Term Investments",        description: "", active: true },
  { id: 49,  code: "12402", name: "Cooperative Shares",                        class: "Asset",            type: "Long Term Investments",        description: "", active: true },
  // Intangible Assets
  { id: 50,  code: "12501", name: "Software",                                  class: "Asset",            type: "Intangible Assets",            description: "", active: true },
  { id: 51,  code: "12502", name: "Licenses",                                  class: "Asset",            type: "Intangible Assets",            description: "", active: true },
  { id: 52,  code: "12601", name: "Accumulated Amortization – Software",       class: "Asset",            type: "Accumulated Amortization",     description: "", active: true },

  // ── LIABILITIES ──────────────────────────────────────────────────────────────
  // Accounts Payable
  { id: 53,  code: "21101", name: "Trade Creditors",                           class: "Liability",        type: "Accounts Payable",             description: "", active: true },
  { id: 54,  code: "21102", name: "Accrued Expenses",                          class: "Liability",        type: "Accounts Payable",             description: "", active: true },
  { id: 55,  code: "21103", name: "Retention Payable",                         class: "Liability",        type: "Accounts Payable",             description: "", active: true },
  // Staff Liabilities
  { id: 56,  code: "21201", name: "Leave Provision",                           class: "Liability",        type: "Staff Liabilities",            description: "", active: true },
  { id: 57,  code: "21202", name: "Service Gratuity Payable",                  class: "Liability",        type: "Staff Liabilities",            description: "", active: true },
  { id: 58,  code: "21203", name: "Salary Payable",                            class: "Liability",        type: "Staff Liabilities",            description: "", active: true },
  // Fees Received in Advance
  { id: 59,  code: "21301", name: "Prepaid Fees",                              class: "Liability",        type: "Fees Received in Advance",     description: "", active: true },
  // Short Term Borrowings
  { id: 60,  code: "21401", name: "Bank Overdraft",                            class: "Liability",        type: "Short Term Borrowings",        description: "", active: true },
  // Deposits
  { id: 61,  code: "21501", name: "Student Deposits",                          class: "Liability",        type: "Deposits",                     description: "", active: true },
  { id: 62,  code: "21502", name: "Tender Deposits",                           class: "Liability",        type: "Deposits",                     description: "", active: true },
  // Non-Current Liabilities
  { id: 63,  code: "22101", name: "Bank Loans",                                class: "Liability",        type: "Non-Current Liabilities",      description: "", active: true },
  { id: 64,  code: "22102", name: "Long Term Gratuity Provision",              class: "Liability",        type: "Non-Current Liabilities",      description: "", active: true },

  // ── EQUITY ───────────────────────────────────────────────────────────────────
  { id: 65,  code: "30101", name: "Capital Fund",                              class: "Equity",           type: "Net Assets / Equity",          description: "", active: true },
  { id: 66,  code: "30102", name: "Accumulated Surplus / Deficit",             class: "Equity",           type: "Net Assets / Equity",          description: "", active: true },
  { id: 67,  code: "30103", name: "Reserves",                                  class: "Equity",           type: "Net Assets / Equity",          description: "", active: true },

  // ── REVENUE ──────────────────────────────────────────────────────────────────
  // Government Capitation – Tuition
  { id: 68,  code: "41001", name: "Textbooks Grant",                           class: "Revenue",          type: "Govt Capitation – Tuition",    description: "", active: true },
  { id: 69,  code: "41002", name: "Exercise Books Grant",                      class: "Revenue",          type: "Govt Capitation – Tuition",    description: "", active: true },
  { id: 70,  code: "41003", name: "Laboratory Chemicals Grant",                class: "Revenue",          type: "Govt Capitation – Tuition",    description: "", active: true },
  { id: 71,  code: "41004", name: "Teaching Materials Grant",                  class: "Revenue",          type: "Govt Capitation – Tuition",    description: "", active: true },
  { id: 72,  code: "41005", name: "Internal Exams Grant",                      class: "Revenue",          type: "Govt Capitation – Tuition",    description: "", active: true },
  { id: 73,  code: "41006", name: "Reference Books Grant",                     class: "Revenue",          type: "Govt Capitation – Tuition",    description: "", active: true },
  // Government Capitation – Operations
  { id: 74,  code: "42001", name: "Personnel Emoluments Grant",                class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  { id: 75,  code: "42002", name: "Electricity Water Conservancy Grant",       class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  { id: 76,  code: "42003", name: "Administration Grant",                      class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  { id: 77,  code: "42004", name: "Local Transport Grant",                     class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  { id: 78,  code: "42005", name: "Maintenance and Improvements Grant",        class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  { id: 79,  code: "42006", name: "Medical and Insurance Grant",               class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  { id: 80,  code: "42007", name: "Activity Grant",                            class: "Revenue",          type: "Govt Capitation – Operations", description: "", active: true },
  // Infrastructure Grants
  { id: 81,  code: "43001", name: "Maintenance & Improvement Grants",          class: "Revenue",          type: "Infrastructure Grants",        description: "", active: true },
  { id: 82,  code: "43002", name: "Transition Infrastructure Grants",          class: "Revenue",          type: "Infrastructure Grants",        description: "", active: true },
  { id: 83,  code: "43003", name: "Economic Stimulus Grants",                  class: "Revenue",          type: "Infrastructure Grants",        description: "", active: true },
  // Special Needs Grants
  { id: 84,  code: "44001", name: "Vocational Materials Grant",                class: "Revenue",          type: "Special Needs Grants",         description: "", active: true },
  { id: 85,  code: "44002", name: "Assistive Devices Grant",                   class: "Revenue",          type: "Special Needs Grants",         description: "", active: true },
  { id: 86,  code: "44003", name: "Teaching Aids Grant",                       class: "Revenue",          type: "Special Needs Grants",         description: "", active: true },
  { id: 87,  code: "44004", name: "Caregiver Services Grant",                  class: "Revenue",          type: "Special Needs Grants",         description: "", active: true },
  // Transfers from Government Entities
  { id: 88,  code: "45001", name: "County Government Transfers",               class: "Revenue",          type: "Govt Entity Transfers",        description: "", active: true },
  { id: 89,  code: "45002", name: "NGCDF Transfers",                           class: "Revenue",          type: "Govt Entity Transfers",        description: "", active: true },
  { id: 90,  code: "45003", name: "Other Government Transfers",                class: "Revenue",          type: "Govt Entity Transfers",        description: "", active: true },
  // Donations and Contributions
  { id: 91,  code: "46001", name: "Public Donations",                          class: "Revenue",          type: "Donations and Contributions",  description: "", active: true },
  { id: 92,  code: "46002", name: "Alumni Donations",                          class: "Revenue",          type: "Donations and Contributions",  description: "", active: true },
  { id: 93,  code: "46003", name: "Religious Institution Donations",           class: "Revenue",          type: "Donations and Contributions",  description: "", active: true },
  { id: 94,  code: "46004", name: "Local Leadership Donations",                class: "Revenue",          type: "Donations and Contributions",  description: "", active: true },
  { id: 95,  code: "46005", name: "Community Donations",                       class: "Revenue",          type: "Donations and Contributions",  description: "", active: true },
  // Parents Contributions / School Fund
  { id: 96,  code: "47001", name: "Maintenance Contribution",                  class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 97,  code: "47002", name: "Medical and Insurance Contribution",        class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 98,  code: "47003", name: "Activity Contribution",                     class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 99,  code: "47004", name: "Lunch Programme Contribution",              class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 100, code: "47005", name: "Boarding Equipment Contribution",           class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 101, code: "47006", name: "Administration Contribution",               class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 102, code: "47007", name: "Local Transport Contribution",              class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 103, code: "47008", name: "Electricity Water Contribution",            class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  { id: 104, code: "47009", name: "Personnel Emoluments Contribution",         class: "Revenue",          type: "Parents Contributions",        description: "", active: true },
  // Income Generating Activities
  { id: 105, code: "48001", name: "Farming Income",                            class: "Revenue",          type: "Income Generating Activities", description: "", active: true },
  { id: 106, code: "48002", name: "Rent Income",                               class: "Revenue",          type: "Income Generating Activities", description: "", active: true },
  { id: 107, code: "48003", name: "Bus Hire Income",                           class: "Revenue",          type: "Income Generating Activities", description: "", active: true },
  { id: 108, code: "48004", name: "Hire of Grounds",                           class: "Revenue",          type: "Income Generating Activities", description: "", active: true },
  { id: 109, code: "48005", name: "Sale of Tender Documents",                  class: "Revenue",          type: "Income Generating Activities", description: "", active: true },
  // Finance Income
  { id: 110, code: "49001", name: "Interest on Fixed Deposits",                class: "Revenue",          type: "Finance Income",               description: "", active: true },
  { id: 111, code: "49002", name: "Interest on Treasury Bills",                class: "Revenue",          type: "Finance Income",               description: "", active: true },
  { id: 112, code: "49003", name: "Interest on Treasury Bonds",                class: "Revenue",          type: "Finance Income",               description: "", active: true },

  // ── EXPENSES ─────────────────────────────────────────────────────────────────
  // Tuition Expenses
  { id: 113, code: "51001", name: "Textbooks",                                 class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  { id: 114, code: "51002", name: "Exercise Books",                            class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  { id: 115, code: "51003", name: "Laboratory Equipment",                      class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  { id: 116, code: "51004", name: "Teaching Materials",                        class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  { id: 117, code: "51005", name: "Exams and Assessment",                      class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  { id: 118, code: "51006", name: "Teachers Guides",                           class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  { id: 119, code: "51007", name: "Bank Charges",                              class: "Expense",          type: "Tuition Expenses",             description: "", active: true },
  // Operations Expenses
  { id: 120, code: "52001", name: "Personnel Emoluments",                      class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 121, code: "52002", name: "Service Gratuity",                          class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 122, code: "52003", name: "Administration Costs",                      class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 123, code: "52004", name: "Repairs and Maintenance",                   class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 124, code: "52005", name: "Local Transport and Travelling",            class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 125, code: "52006", name: "Electricity Water Conservancy",             class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 126, code: "52007", name: "Medical and Insurance",                     class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 127, code: "52008", name: "Activity Expenses",                         class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  { id: 128, code: "52009", name: "Bank Charges",                              class: "Expense",          type: "Operations Expenses",          description: "", active: true },
  // Boarding and School Fund Expenses
  { id: 129, code: "53001", name: "Food Supplies",                             class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 130, code: "53002", name: "Boarding Equipment and Stores",             class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 131, code: "53003", name: "Lunch Programme",                           class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 132, code: "53004", name: "Activity Expenses",                         class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 133, code: "53005", name: "Personnel Emoluments",                      class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 134, code: "53006", name: "Administration Costs",                      class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 135, code: "53007", name: "Electricity Water Conservancy",             class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 136, code: "53008", name: "Local Transport",                           class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  { id: 137, code: "53009", name: "Rent Expenses",                             class: "Expense",          type: "Boarding and School Fund",     description: "", active: true },
  // Special Needs Expenses
  { id: 138, code: "54001", name: "Vocational Materials",                      class: "Expense",          type: "Special Needs Expenses",       description: "", active: true },
  { id: 139, code: "54002", name: "Hearing Aids",                              class: "Expense",          type: "Special Needs Expenses",       description: "", active: true },
  { id: 140, code: "54003", name: "Braille Materials",                         class: "Expense",          type: "Special Needs Expenses",       description: "", active: true },
  { id: 141, code: "54004", name: "Caregiver Services",                        class: "Expense",          type: "Special Needs Expenses",       description: "", active: true },
  // Depreciation
  { id: 142, code: "55001", name: "Depreciation – Buildings",                  class: "Expense",          type: "Depreciation",                 description: "", active: true },
  { id: 143, code: "55002", name: "Depreciation – Equipment",                  class: "Expense",          type: "Depreciation",                 description: "", active: true },
  { id: 144, code: "55003", name: "Depreciation – Vehicles",                   class: "Expense",          type: "Depreciation",                 description: "", active: true },
  { id: 145, code: "55004", name: "Amortization – Intangible Assets",          class: "Expense",          type: "Depreciation",                 description: "", active: true },
  // Finance Costs
  { id: 146, code: "56001", name: "Interest on Bank Loans",                    class: "Expense",          type: "Finance Costs",                description: "", active: true },
  { id: 147, code: "56002", name: "Interest on Overdrafts",                    class: "Expense",          type: "Finance Costs",                description: "", active: true },
  // Gains and Losses
  { id: 148, code: "57001", name: "Gain/Loss on Disposal of Assets",           class: "Expense",          type: "Gains and Losses",             description: "", active: true },
  { id: 149, code: "57002", name: "Fair Value Adjustments",                    class: "Expense",          type: "Gains and Losses",             description: "", active: true },
  { id: 150, code: "57003", name: "Asset Impairment",                          class: "Expense",          type: "Gains and Losses",             description: "", active: true },

  // ── STORES CONSUMPTION ───────────────────────────────────────────────────────
  { id: 151, code: "60101", name: "Food Consumption",                          class: "Stores Consumption", type: "Stores Consumption",         description: "", active: true },
  { id: 152, code: "60102", name: "Stationery Consumption",                    class: "Stores Consumption", type: "Stores Consumption",         description: "", active: true },
  { id: 153, code: "60103", name: "Laboratory Materials Consumption",          class: "Stores Consumption", type: "Stores Consumption",         description: "", active: true },
  { id: 154, code: "60104", name: "Cleaning Materials Consumption",            class: "Stores Consumption", type: "Stores Consumption",         description: "", active: true },
  { id: 155, code: "60105", name: "Electrical Materials Consumption",          class: "Stores Consumption", type: "Stores Consumption",         description: "", active: true },
  { id: 156, code: "60106", name: "Maintenance Materials Consumption",         class: "Stores Consumption", type: "Stores Consumption",         description: "", active: true },
];

const ACCOUNT_CLASSES: AccountClass[] = ["Asset", "Liability", "Equity", "Revenue", "Expense", "Stores Consumption"];

const emptyForm = { code: "", name: "", class: "Asset" as AccountClass, type: "", description: "" };

export default function ChartOfAccounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = accounts.filter((a) => {
    const matchSearch =
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "All" || a.class === filterClass;
    return matchSearch && matchClass;
  });
  const { page, setPage, pageSize, setPageSize, paginatedItems, totalPages, from, to, total } = usePagination(filtered);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(acc: Account) {
    setEditingId(acc.id);
    setForm({ code: acc.code, name: acc.name, class: acc.class, type: acc.type, description: acc.description });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: "Validation Error", description: "Account code and name are required.", variant: "destructive" });
      return;
    }
    if (editingId !== null) {
      setAccounts((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form } : a))
      );
      toast({ title: "Account Updated", description: `${form.name} has been updated.` });
    } else {
      const newAcc: Account = { id: Date.now(), ...form, active: true };
      setAccounts((prev) => [...prev, newAcc]);
      toast({ title: "Account Created", description: `${form.name} added to chart of accounts.` });
    }
    setDialogOpen(false);
  }

  function toggleActive(id: number) {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, active: !a.active };
        toast({ title: next.active ? "Account Activated" : "Account Deactivated", description: `${a.name} is now ${next.active ? "active" : "inactive"}.` });
        return next;
      })
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all GL account codes and classifications</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Account
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Classes</SelectItem>
                {ACCOUNT_CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono font-medium">{acc.code}</TableCell>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{acc.class}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{acc.type}</TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-xs truncate">{acc.description}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acc.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                      {acc.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(acc)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(acc.id)} title="Toggle status">
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-10">No accounts match your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Account" : "New Account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Account Code *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1100" />
              </div>
              <div className="space-y-1">
                <Label>Class *</Label>
                <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v as AccountClass })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Account Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cash at Bank" />
            </div>
            <div className="space-y-1">
              <Label>Account Type</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="e.g. Current Asset" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Save Changes" : "Create Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
