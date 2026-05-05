from django.urls import path
from .views import (
    BookTitleListCreateView, BookTitleDetailView,
    BookCopyListCreateView, BookCopyDetailView, BookCopyStatusView,
    LoanTransactionListView, IssueBookView, ReturnBookView,
    LibraryReceiptListCreateView, LibraryReceiptDetailView,
    NextAccessionView, GenerateAccessionsView,
    BorrowersView,
    BookListView,
)

urlpatterns = [
    # Book Titles (catalogue)
    path('titles/', BookTitleListCreateView.as_view(), name='library-titles'),
    path('titles/<str:id>/', BookTitleDetailView.as_view(), name='library-titles-detail'),

    # Book Copies
    path('copies/', BookCopyListCreateView.as_view(), name='library-copies'),
    path('copies/<str:id>/', BookCopyDetailView.as_view(), name='library-copies-detail'),
    path('copies/<str:id>/status/', BookCopyStatusView.as_view(), name='library-copies-status'),

    # Loan Transactions
    path('loans/', LoanTransactionListView.as_view(), name='library-loans'),
    path('loans/issue/', IssueBookView.as_view(), name='library-loans-issue'),
    path('loans/<str:id>/return/', ReturnBookView.as_view(), name='library-loans-return'),

    # Receipts
    path('receipts/', LibraryReceiptListCreateView.as_view(), name='library-receipts'),
    path('receipts/<str:id>/', LibraryReceiptDetailView.as_view(), name='library-receipts-detail'),

    # Accession numbers
    path('accession/next/', NextAccessionView.as_view(), name='library-accession-next'),
    path('accession/generate/', GenerateAccessionsView.as_view(), name='library-accession-generate'),

    # Borrowers (derived from loan history)
    path('borrowers/', BorrowersView.as_view(), name='library-borrowers'),

    # Legacy
    path('books/', BookListView.as_view(), name='librarian-books'),
]
