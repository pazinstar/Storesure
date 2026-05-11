# 📘 StoreSure Developer Brief
## Permanent Stores Ledger, Fixed Asset Register & Capitalization Rules Engine

> 🎯 **Core Objective:** `«Audit-ready institutional accountability.»`  
> *This module goes beyond inventory management. It is designed for IPSAS compliance, public school audit readiness, and institutional asset governance.*

---

## 📊 Current System Coverage
| ✅ Already Implemented | 🚧 Missing (To Implement) |
|------------------------|---------------------------|
| Consumable stores      | 1. Permanent & Expendable Stores Ledger (S2) |
| Procurement workflows  | 2. Fixed Asset Register |
| GRN / Issue workflows  | 3. Capitalization rules engine |
| S1 ledger concepts     | 4. Bulk capitalization handling |
|                        | 5. Custodian accountability workflows |
|                        | 6. Asset lifecycle management |
|                        | 7. Depreciation engine |
|                        | 8. IPSAS-aligned asset governance workflows |

### 🔍 Why These Features Matter
- 📜 **IPSAS & Audit Compliance** – Meets Kenyan public school financial expectations
- 🔐 **Clear Accountability** – Separates inventory (consumables) from PPE (fixed assets)
- 📈 **Accurate Financial Reporting** – Proper capitalization, depreciation & disposal tracking
- 🛡️ **Governance Moat** – Positions StoreSure as a *hybrid stores + accountability + asset platform*

---

## 🧩 PART 1–16: Core Accounting & Asset Modules

### 🔹 PART 1 — Accounting & Logic Foundation
**Item Classification Structure** *(Every item MUST belong to one category)*
| Category     | Description                                  |
|--------------|----------------------------------------------|
| `Consumable` | Used up during operations                    |
| `Expendable` | Reusable, lower-value, moderate lifespan     |
| `Permanent`  | Durable, long-term, below capital threshold  |
| `Fixed Asset`| Capitalized long-term asset (PPE)            |

---

### 🔹 PART 2 — Category Definitions & System Behavior

#### 📦 1. Consumables
- **Examples:** Food, fuel, paper, chemicals, soap, printing materials
- **Behavior:** Quantity tracked → Expensed on issue → S1 ledger → No depreciation → No custodian tracking

#### 🔄 2. Expendables
- **Examples:** Brooms, buckets, sports balls, dust coats, small tools, extension cables
- **Behavior:** Temporary identity retention → Assigned to custodian/dept → S2 ledger → No depreciation → Lower-value accountability

#### 🏢 3. Permanent Items
- **Examples:** Desks, beds, cabinets, computers, projectors
- **Behavior:** Durable & long-term → Tracked in S2 → May qualify for capitalization → Requires strong accountability

#### 🏗️ 4. Fixed Assets
- **Examples:** Buildings, vehicles, solar systems, generators, bulk-capitalized furniture, major ICT equipment
- **Behavior:** Fixed Asset Register → Depreciated → Full lifecycle & disposal tracking

---

### 🔹 PART 3 — S2 Permanent & Expendable Stores Ledger
**Objective:** Dedicated ledger for permanent & reusable items, strictly separated from S1 consumables.

#### 📋 Required Ledger Fields
| Field             | Field              |
|-------------------|--------------------|
| Date              | Reference No       |
| Item Name         | Item Category      |
| Unit              | Quantity Received  |
| Quantity Issued   | Running Balance    |
| Unit Cost         | Total Value        |
| Supplier          | Recipient/Custodian|
| Department        | Condition          |
| Remarks           | Created By         |
| Approved By       |                    |

#### 🔄 Required Workflows
| Workflow       | Flow                                  |
|----------------|---------------------------------------|
| Receipt        | `GRN → Inspection → S2 Posting`       |
| Issue          | `Issue Voucher → Recipient Assignment → S2 Posting` |
| Transfer       | Department-to-department tracking (e.g., `Science → Boarding`) |
| Return         | Reusable items returned to stores     |
| Damage/Loss    | Record: `damaged / lost / obsolete / condemned` → Full audit trail |

---

### 🔹 PART 4 — Fixed Asset Register
**Required Fields:**
`Asset ID` | `Asset Tag Number` | `Asset Category` | `Asset Name` | `Description` | `Serial Number` | `Quantity` | `Unit Cost` | `Total Cost` | `Acquisition Date` | `Supplier` | `Funding Source` | `Department` | `Custodian` | `Location` | `Useful Life` | `Residual Value` | `Depreciation Method` | `Accumulated Depreciation` | `Current Book Value` | `Asset Status` | `Warranty Expiry` | `Last/Next Maintenance Date` | `Disposal Status`

---

### 🔹 PART 5 & 6 — Capitalization Rules Engine & Decision Rules
> ⚠️ **Core Principle:** Capitalization must **NOT** rely solely on invoice/procurement totals. It must evaluate: unit value, aggregate materiality, useful life, durability, nature of use, institutional control, and future service potential.

#### ⚙️ Configurable Settings
| Setting                  | Example Value       |
|--------------------------|---------------------|
| Capitalization Threshold | KES 50,000          |
| Bulk Materiality Threshold| KES 500,000         |
| Minimum Useful Life      | 1 year              |
| Depreciation Start Rule  | Upon deployment     |
| Default Residual Value % | 0%                  |
| Asset Classes            | Furniture, ICT, Vehicles, etc. |

#### 📐 Decision Rules
| Rule | Condition | System Action |
|------|-----------|---------------|
| **A. Consumable** | Consumed during ops + short life + no future service | → Classify as Consumable → S1 ledger → Expense on issue |
| **B. Expendable** | Reusable + moderate life + low value + not material | → Classify as Expendable → S2 ledger → Assign custodian → No depreciation |
| **C. Individual Capitalization** | Useful life > 1 yr **AND** unit value ≥ threshold | → Auto-capitalize → Create fixed asset record → Assign depreciation profile |
| **D. Bulk Capitalization** | Individually below threshold **BUT** aggregate is material | → Trigger grouped capitalization workflow → Prompt: `«"This purchase qualifies for grouped capitalization. Proceed?"»` |

---

### 🔹 PART 7 — Grouped Capitalization Logic
**Example:** `1,000 desks × KES 5,000 = KES 5,000,000`  
**Required Features:**
- ✅ One master asset record
- ✅ Multiple sub-locations
- ✅ Grouped depreciation
- ✅ Optional child-item tagging
- ✅ Partial disposal handling

---

### 🔹 PART 8 — Depreciation Engine
- **Method:** Straight-line (initially)
- **Frequency:** Monthly or annual
- **Auto-Updates:** Accumulated depreciation & current book value
- **Formula:**  
  `Annual Depreciation = (Cost − Residual Value) ÷ Useful Life`
- **Reports:** Asset register, depreciation schedule, NBV report, asset movement report

---

### 🔹 PART 9 — Asset Lifecycle Management
**Status Flow:**  
`Procured → In Stores → Deployed → Active → Under Maintenance → Damaged → Lost → Obsolete → Disposed`  
> 📌 **Depreciation Rule:** Begins **upon deployment** unless overridden by policy.

---

### 🔹 PART 10 & 11 — Partial Disposal & Disposal Workflow
**Partial Disposal:** Reduce quantity → Adjust NBV proportionally → Maintain disposal history  
**Disposal Requirements:** Approval workflow → Committee references → Disposal proceeds → Write-off entries → Full audit logs

---

### 🔹 PART 12 & 13 — Decision Assistant & Override Workflow
| Scenario                | System Suggestion          |
|-------------------------|----------------------------|
| Short-life item         | Expense                    |
| Low-value reusable      | Expendable                 |
| High-value durable      | Capitalize                 |
| Large durable batch     | Grouped capitalization     |

**Override Rules:** Authorized users may bypass suggestions with:
- 🔒 Mandatory reason entry
- ✅ Approval workflow
- 📜 Full audit logging  
*Example:* `«"Approved as expense due to donor policy."»`

---

### 🔹 PART 14 — Audit & Control Features
| Control          | Requirement                                      |
|------------------|--------------------------------------------------|
| Audit Trail      | Track creator, editor, approver, timestamps      |
| Locked Posting   | Posted records cannot be edited directly. Changes require reversal/adjustment workflow |
| Documentation    | Attach: invoices, GRNs, issue vouchers, inspection reports, disposal approvals |

---

### 🔹 PART 15 — Reporting Requirements
**📦 S2 Reports:** Permanent stores ledger, Expendable items ledger, Custodian issue reports, Department allocation reports  
**🏗️ Asset Reports:** Fixed asset register, Depreciation schedule, Asset movement/valuation/aging reports, Maintenance report, Capitalized/uncapitalized/overridden assets, PPE movement schedule, Grouped asset summary

---

### 🔹 PART 16 — Strategic Product Positioning
> 💡 *Most school systems expense assets incorrectly, ignore grouped capitalization, lack permanent stores logic, and fail to integrate stores with asset management.*  
> StoreSure will evolve into a **hybrid stores + institutional accountability + asset governance platform** → a major competitive moat in Kenyan public schools.

---

## 📦 Developer Brief: Item Classification (MVP)
**Objective:** Simple, consistent 4-type classification system for inventory, accountability, and asset management.

### 🔑 Core Logic & Validation
| Type         | Behavior                                  |
|--------------|-------------------------------------------|
| `Consumable` | Track qty → Expense on issue → S1 ledger  |
| `Expendable` | Track qty → Optional custodian → S2 ledger → No depreciation |
| `Permanent`  | Track individually → Custodian required → S2 ledger → May upgrade to Fixed Asset |
| `Fixed Asset`| Asset register → Depreciation required → Full lifecycle tracking |

- ✅ **Validation:** Every item MUST have one of the 4 types. No custom types in MVP.
- 🖥️ **UI Requirement:** Dropdown limited to: `Consumable | Expendable | Permanent | Fixed Asset`
- 🤖 **Future Enhancement:** Auto-suggest type based on item category & value

**Default Examples:**
| Item        | Type         |
|-------------|--------------|
| Stapler     | Expendable   |
| Beaker      | Expendable   |
| Basketball  | Expendable   |
| Chemicals   | Consumable   |
| Desks       | Permanent    |
| Computers   | Fixed Asset  |

---

## 📝 Developer Brief: Requisition Module (MVP)
> 🎯 `«Initiates demand → Enforces approval → Links to issuance (SIV) → Supports audit.»`

### 1️⃣ Core Workflow
`Create Requisition → Approval → Generate SIV → Issue Items`

### 2️⃣ Header Fields
`Requisition No (auto)` | `Department` | `Requested By` | `Request Date` | `Required By Date` | `Priority (H/N/L)` | `Account` | `Vote Head` | `Purpose`

### 3️⃣ Item Lines
`Item Code` | `Item Name` | `Unit` | `In Stock (auto)` | `Available (auto)` | `Requested Qty` | `Approved Qty` | `Issued Qty` | `Balance (auto)`

### 4️⃣ Key Logic
- 📊 **Stock Visibility:** `Available = In Stock – Committed`
- 🔒 **Commitment:** Approved qty reserves stock
- 📝 **Line-Level Control:** Allow approve/reject/partial approval per item

### 5️⃣ Approval & SIV Integration
- Multi-level configurable workflow
- Status: `Draft → Pending → Approved / Partially Approved / Rejected / Returned → Issued`
- Button: `Generate Issue Voucher` → Links `Requisition No ↔ SIV No` → Issue only approved qty

### 6️⃣ Budget Control & Audit
- Link to Account & Vote Head → Show `Budget | Spent | Balance` → Warn/block if exceeded
- Track: creator, editor, approval history, status changes, timestamps
- 🖨️ **Print:** A4 layout with header, item table, approvals, issue section, signatures

### 📌 MVP Scope (Do First)
1. Header + item lines
2. Approval workflow
3. Stock visibility & line-level approval
4. SIV linkage
5. Print function

> 💡 *Key Principle:* `«Requisition is the control point for stock and budget — not just a request form.»`

---

## 📄 Minimal Developer Brief: LPO & LSO Enhancements

### 🔗 LPO Missing Elements (Add for Linkage)
| Area                | Required Fields                                  |
|---------------------|--------------------------------------------------|
| Delivery Details    | Expected Delivery Date                           |
| Financial Class.    | Account, Vote Head                               |
| Procurement Ref.    | Procurement Method (e.g., RFQ), Quotation Ref    |
| VAT/Tax Handling    | VAT Type (Inclusive/Exclusive), VAT Amount       |
| LPO Validity        | Valid Until Date (explicit)                      |

> 🔑 *Rule:* `«LPO must be traceable to: Requisition → Procurement → Delivery → Payment»`  
> *Note: LPO is functionally OK as-is. Add linkage fields only.*

---

### 🛠️ Local Service Order (LSO) — Printable A4 Design
> 🎯 *Mirrors LPO but tailored for services. Includes completion certification & verification before payment.*

#### 📋 Structure & Fields
| Section              | Fields / Content                                                                 |
|----------------------|----------------------------------------------------------------------------------|
| **Header**           | `[SCHOOL NAME] LOCAL SERVICE ORDER (LSO)`                                        |
| **Reference Info**   | `LSO No` | `Date` | `Requisition No` | `Procurement Method` | `Quotation Ref`     |
| **Provider Details** | Name, KRA PIN, Address, Phone, Email                                             |
| **Service Details**  | Description, Location, Start Date, Completion Date                               |
| **Financial Class.** | Account, Vote Head                                                               |
| **Cost Breakdown**   | Description | Unit | Qty | Unit Cost (KES) | Total (KES)                             |
| **Totals**           | Subtotal | VAT | Total Cost                                                     |
| **Terms & Conditions**| 5-point standard service agreement (performance, inspection, payment, referencing, validity) |
| **Authorization**    | Prepared By | Authorized By (Bursar) | Principal | Signatures & Dates            |
| **Completion Cert.** | Work Completed By | Verified By (Inspection Committee) | Date | Remarks              |
| **Provider Ack.**    | `I accept this LSO and agree to perform the services as specified.` → Name, Signature/Stamp, Date |
| **System Footer**    | `Generated By: StoreSure` | `Print Date: Auto` | `System Ref ID: Auto`            |

#### 🔍 LPO vs LSO Critical Differences
| Feature          | LPO (Goods)                  | LSO (Services)                  |
|------------------|------------------------------|---------------------------------|
| Proof of Delivery| GRN required                 | Completion certification required |
| Verification     | Delivery note                | Work completion inspection      |
| Core Principle   | `Authorization to supply`    | `Authorization to perform & pay → requires verification` |

---

## 🛠️ Developer Next Steps & Action Plan
- [ ] ✅ Cross-check current codebase against this brief
- [ ] 🔄 Merge with latest branch: `version-6`
- [ ] 🔍 Compare with shared chats/topics to identify gaps
- [ ] 📦 Implement missing fields, workflows, and validation rules
- [ ] 🧪 Test: S1/S2 separation, capitalization triggers, grouped assets, depreciation engine, requisition → SIV flow, LPO/LSO linkage & print layouts
- [ ] 📜 Ensure full audit trails, locked posting, and override logging are active

> 💡 *Tip:* Start with **MVP scopes** (Item Classification → Requisition → LPO linkage → LSO template) before rolling out depreciation & grouped capitalization logic.

---
*Document ready for engineering handoff. All logic, field mappings, and compliance requirements are preserved and structured for rapid implementation.*