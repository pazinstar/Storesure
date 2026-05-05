from django.urls import path
from .views import (
    StudentListCreateView, StudentDetailView,
    StudentLastThreeView,
    DistributionRecentView, DistributionDetailView,
    DistributionRegisterView,
    NotCollectedView,
    ReplacementView, ReplacementDetailView,
    # Fee Structures
    FeeStructureListCreateView, FeeStructureDetailView,
    # Billing
    StudentBillListView, StudentBillDetailView,
    GenerateBillingRunView, PostBillingRunView,
    # Statement
    StudentBalanceSummaryView, StudentStatementView,
    # Bursaries
    BursaryListCreateView, BursaryDetailView,
)

urlpatterns = [
    # Students
    path('', StudentListCreateView.as_view(), name='students-list'),
    path('last-three/', StudentLastThreeView.as_view(), name='students-last-three'),

    # Distributions (must come before <str:id>/ to avoid capture)
    path('distributions/recent/', DistributionRecentView.as_view(), name='distributions-recent'),
    path('distributions/recent/<str:id>/', DistributionDetailView.as_view(), name='distributions-detail'),
    path('distributions/register/', DistributionRegisterView.as_view(), name='distributions-register'),
    path('distributions/not-collected/', NotCollectedView.as_view(), name='distributions-not-collected'),
    path('distributions/replacements/', ReplacementView.as_view(), name='distributions-replacements'),
    path('distributions/replacements/<str:id>/', ReplacementDetailView.as_view(), name='distributions-replacements-detail'),

    # Fee Structures
    path('fee-structures/', FeeStructureListCreateView.as_view(), name='fee-structures-list'),
    path('fee-structures/<str:id>/', FeeStructureDetailView.as_view(), name='fee-structures-detail'),

    # Billing
    path('billing/', StudentBillListView.as_view(), name='student-bills-list'),
    path('billing/generate/', GenerateBillingRunView.as_view(), name='billing-generate'),
    path('billing/post/', PostBillingRunView.as_view(), name='billing-post'),
    path('billing/<str:id>/', StudentBillDetailView.as_view(), name='student-bill-detail'),

    # Student Statements
    path('balances/', StudentBalanceSummaryView.as_view(), name='student-balances'),
    path('<str:student_id>/statement/', StudentStatementView.as_view(), name='student-statement'),

    # Bursaries
    path('bursaries/', BursaryListCreateView.as_view(), name='bursaries-list'),
    path('bursaries/<str:id>/', BursaryDetailView.as_view(), name='bursaries-detail'),

    # Student detail (last — catches <str:id>)
    path('<str:id>/', StudentDetailView.as_view(), name='students-detail'),
]
