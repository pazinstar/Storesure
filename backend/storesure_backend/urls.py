from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import (
    SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView,
)
# Deliveries view import removed to avoid importing heavy stores.views at project import time
from roles.procurement.purchase.views import (
    PurchaseRequisitionListCreateView,
    PurchaseRequisitionDetailView,
    TenderListCreateView,
    QuotationListCreateView,
    LPOListCreateView,
    LPODetailView,
    LPOStatsView,
        SupplierStatsView,
    ProcurementReferenceListCreateView,
    ProcurementReferenceDetailView,
    ProcurementReferenceClearView,
    ProcurementContractListCreateView,
    ProcurementContractDetailView,
    ProcurementContractClearView,
    ContractMilestoneCreateView,
    ContractMilestonePayView,
    ProcurementSupplierListCreateView,
    ProcurementSupplierDetailView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/v1/', include([
        # ── Auth ─────────────────────────────────────────────────────────────
        path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('auth/', include('common.authentication.urls')),

        # ── Administration (schools, stores, libraries, departments,
        #                   roles, users, kpis, branding, setup) ─────────────
        path('admin/', include('roles.admin.dashboard.urls')),

        # ── Deliveries (global) ───────────────────────────────────────────────
        # The deliveries endpoint is provided under the storekeeper app routes.

        # ── Students ──────────────────────────────────────────────────────────
        path('students/', include('roles.students.urls')),

        # ── Staff ─────────────────────────────────────────────────────────────
        path('staff/', include('roles.staff.urls')),

        # ── Finance ───────────────────────────────────────────────────────────
        path('finance/', include('roles.finance.urls')),

        # ── Procurement ───────────────────────────────────────────────────────
        path('procurement/dashboard/', include('roles.procurement.dashboard.urls')),
        path('procurement/purchase/', include('roles.procurement.purchase.urls')),
        path('procurement/purchase-requisitions/', PurchaseRequisitionListCreateView.as_view(), name='procurement-purchase-reqs'),
        path('procurement/purchase-requisitions/<str:id>/', PurchaseRequisitionDetailView.as_view(), name='procurement-purchase-reqs-detail'),
        path('procurement/tenders/', TenderListCreateView.as_view(), name='procurement-tenders'),
        path('procurement/quotations/', QuotationListCreateView.as_view(), name='procurement-quotations'),
        path('procurement/lpos/stats/', LPOStatsView.as_view(), name='procurement-lpos-stats'),
        path('procurement/suppliers/stats/', SupplierStatsView.as_view(), name='procurement-suppliers-stats'),
        path('procurement/lpos/', LPOListCreateView.as_view(), name='procurement-lpos'),
        path('procurement/lpos/<str:id>/', LPODetailView.as_view(), name='procurement-lpos-detail'),
        path('procurement/references/clear/', ProcurementReferenceClearView.as_view(), name='procurement-references-clear'),
        path('procurement/references/', ProcurementReferenceListCreateView.as_view(), name='procurement-references'),
        path('procurement/references/<str:id>/', ProcurementReferenceDetailView.as_view(), name='procurement-references-detail'),
        path('procurement/contracts/clear/', ProcurementContractClearView.as_view(), name='procurement-contracts-clear'),
        path('procurement/contracts/', ProcurementContractListCreateView.as_view(), name='procurement-contracts'),
        path('procurement/contracts/<str:id>/', ProcurementContractDetailView.as_view(), name='procurement-contracts-detail'),
        path('procurement/contracts/<str:contract_id>/milestones/', ContractMilestoneCreateView.as_view(), name='procurement-milestones'),
        path('procurement/contracts/<str:contract_id>/milestones/<str:milestone_id>/pay/', ContractMilestonePayView.as_view(), name='procurement-milestones-pay'),
        path('procurement/reports/', include('roles.procurement.reports.urls')),
        path('procurement/suppliers/', ProcurementSupplierListCreateView.as_view(), name='procurement-suppliers'),
        path('procurement/suppliers/<str:id>/', ProcurementSupplierDetailView.as_view(), name='procurement-suppliers-detail'),

        # ── Storekeeper ───────────────────────────────────────────────────────
        path('storekeeper/dashboard/', include('roles.storekeeper.dashboard.urls')),
        path('storekeeper/stores/', include('roles.storekeeper.stores.urls')),

        # ── Bursar ────────────────────────────────────────────────────────────
        path('bursar/dashboard/', include('roles.bursar.dashboard.urls')),
        path('bursar/finance/', include('roles.bursar.finance.urls')),
        path('bursar/reports/', include('roles.bursar.reports.urls')),

        # ── Librarian ─────────────────────────────────────────────────────────
        path('librarian/dashboard/', include('roles.librarian.dashboard.urls')),
        path('librarian/library/', include('roles.librarian.library.urls')),

        # ── Headteacher ───────────────────────────────────────────────────────
        path('headteacher/dashboard/', include('roles.headteacher.dashboard.urls')),
        path('headteacher/approvals/', include('roles.headteacher.approvals.urls')),

        # ── Auditor ───────────────────────────────────────────────────────────
        path('auditor/dashboard/', include('roles.auditor.dashboard.urls')),
        path('auditor/reports/', include('roles.auditor.reports.urls')),

        # ── Messaging ─────────────────────────────────────────────────────────
        path('messages/', include('common.messaging.urls')),

        # ── API Documentation ─────────────────────────────────────────────────
        path('schema/', SpectacularAPIView.as_view(), name='schema'),
        path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ])),
]
