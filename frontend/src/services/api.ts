import { authService } from "./auth.service";
import { inventoryService } from "./inventory.service";
import { procurementService } from "./procurement.service";
import { assetsService } from "./assets.service";
import { recordsService } from "./records.service";
import { reportsService } from "./reports.service";
import lsoService from "./lso.service";
import lpoService from "./lpo.service";
import s2Service from "./s2.service";
import capitalizationService from "./capitalization.service";
import { libraryService } from "./library.service";
import { studentsService } from "./students.service";
import { staffService } from "./staff.service";
import { adminService } from "./admin.service";
import { usersService } from "./users.service";
import { riaService } from "./ria.service";
import { financeService } from "./finance.service";

export const api = {
    ...authService,
    ...inventoryService,
    getDashboardTransactions: () => inventoryService.getDashboardTransactions(),
    getDashboardLowStock: () => inventoryService.getDashboardLowStock(),
    getDashboardStats: () => inventoryService.getDashboardStats(),

    // S12 Requisitions API
    getS12Requisitions: () => inventoryService.getS12Requisitions(),
    createS12Requisition: (data: Parameters<typeof inventoryService.createS12Requisition>[0]) => inventoryService.createS12Requisition(data),
    updateS12Requisition: (id: string, data: Parameters<typeof inventoryService.updateS12Requisition>[1]) => inventoryService.updateS12Requisition(id, data),

    // Purchase Requisitions
    createPurchaseRequisition: (data: Parameters<typeof procurementService.createPurchaseRequisition>[0]) => procurementService.createPurchaseRequisition(data),

    // Tenders & Quotations
    createTender: (data: Parameters<typeof procurementService.createTender>[0]) => procurementService.createTender(data),
    createQuotation: (data: Parameters<typeof procurementService.createQuotation>[0]) => procurementService.createQuotation(data),
    ...procurementService,
    ...assetsService,
    ...s2Service,
    ...recordsService,
    ...reportsService,
    ...lsoService,
    ...lpoService,
    ...capitalizationService,
    ...libraryService,
    ...studentsService,
    ...staffService,
    ...adminService,
    ...usersService,
    ...riaService,
    ...financeService,
};

export { apiConfig } from "./config";
