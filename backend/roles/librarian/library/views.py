from datetime import date
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import BookTitle, BookCopy, LoanTransaction, LibraryReceipt, Book
from .serializers import (
    BookTitleSerializer, BookCopySerializer,
    LoanTransactionSerializer, LibraryReceiptSerializer, BookSerializer,
)


# ─── Book Titles ──────────────────────────────────────────────────────────────

class BookTitleListCreateView(generics.ListCreateAPIView):
    queryset = BookTitle.objects.all().order_by('title')
    serializer_class = BookTitleSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'author', 'isbn', 'subject']
    ordering_fields = ['title', 'author', 'created_at']


class BookTitleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookTitle.objects.all()
    serializer_class = BookTitleSerializer
    lookup_field = 'id'


# ─── Book Copies ──────────────────────────────────────────────────────────────

class BookCopyListCreateView(generics.ListCreateAPIView):
    queryset = BookCopy.objects.all().order_by('accession_no')
    serializer_class = BookCopySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'category', 'location']
    search_fields = ['accession_no', 'book_title', 'author', 'isbn']
    ordering_fields = ['accession_no', 'book_title', 'status', 'received_date']


class BookCopyDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookCopy.objects.all()
    serializer_class = BookCopySerializer
    lookup_field = 'id'


class BookCopyStatusView(APIView):
    """PATCH /copies/<id>/status/ — update status with optional remarks."""

    def patch(self, request, id):
        try:
            copy = BookCopy.objects.get(id=id)
        except BookCopy.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        remarks = request.data.get('status_remarks', '')

        if not new_status:
            return Response({'detail': 'status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_status in ('Damaged', 'Lost') and not remarks:
            return Response(
                {'detail': f'Remarks are mandatory when marking a book as {new_status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if copy.status in ('Issued', 'Overdue') and new_status != 'Lost':
            return Response(
                {'detail': 'Cannot change status of issued books. Use the Return function.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        copy.status = new_status
        copy.status_remarks = remarks if new_status in ('Damaged', 'Lost') else None
        if new_status == 'Lost':
            copy.current_borrower_id = None
            copy.current_borrower_name = None
            copy.current_borrower_type = None
            copy.current_borrower_class = None
            copy.issue_date = None
            copy.due_date = None
            # Mark active loan as returned
            LoanTransaction.objects.filter(
                accession_no=copy.accession_no, status__in=['Active', 'Overdue']
            ).update(status='Returned', notes=remarks or 'Marked as lost')
        copy.save()
        return Response(BookCopySerializer(copy).data)


# ─── Loan Transactions ────────────────────────────────────────────────────────

class LoanTransactionListView(generics.ListAPIView):
    queryset = LoanTransaction.objects.all().order_by('-created_at')
    serializer_class = LoanTransactionSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'borrower_type']
    search_fields = ['accession_no', 'book_title', 'borrower_name', 'borrower_id', 'transaction_no']
    ordering_fields = ['issue_date', 'due_date', 'created_at']


class IssueBookView(APIView):
    """POST — issue a book copy to a borrower."""

    def post(self, request):
        accession_no = request.data.get('accession_no')
        if not accession_no:
            return Response({'detail': 'accession_no is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            copy = BookCopy.objects.get(accession_no=accession_no)
        except BookCopy.DoesNotExist:
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

        if copy.status != 'Available':
            return Response(
                {'detail': f'Book is not available (current status: {copy.status}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_date = request.data.get('issue_date') or date.today().isoformat()
        due_date = request.data.get('due_date')
        if not due_date:
            return Response({'detail': 'due_date is required.'}, status=status.HTTP_400_BAD_REQUEST)

        txn = LoanTransaction.objects.create(
            accession_no=accession_no,
            book_title=copy.book_title,
            book_author=copy.author,
            book_category=copy.category,
            borrower_id=request.data.get('borrower_id', ''),
            borrower_name=request.data.get('borrower_name', ''),
            borrower_type=request.data.get('borrower_type', 'Student'),
            borrower_class=request.data.get('borrower_class'),
            issue_date=issue_date,
            due_date=due_date,
        )

        copy.status = 'Issued'
        copy.current_borrower_id = txn.borrower_id
        copy.current_borrower_name = txn.borrower_name
        copy.current_borrower_type = txn.borrower_type
        copy.current_borrower_class = txn.borrower_class
        copy.issue_date = issue_date
        copy.due_date = due_date
        copy.save()

        return Response(
            {'transaction': LoanTransactionSerializer(txn).data, 'copy': BookCopySerializer(copy).data},
            status=status.HTTP_201_CREATED,
        )


class ReturnBookView(APIView):
    """PATCH /loans/<id>/return/ — process a book return."""

    def patch(self, request, id):
        try:
            txn = LoanTransaction.objects.get(id=id)
        except LoanTransaction.DoesNotExist:
            return Response({'detail': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)

        if txn.status not in ('Active', 'Overdue'):
            return Response({'detail': 'This loan is already closed.'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        late_days = max(0, (today - txn.due_date).days)
        condition = request.data.get('return_condition', 'Good')
        notes = request.data.get('notes', '')

        txn.return_date = today
        txn.return_condition = condition
        txn.late_days = late_days
        txn.status = 'Returned'
        txn.notes = notes
        txn.save()

        try:
            copy = BookCopy.objects.get(accession_no=txn.accession_no)
            copy.status = 'Damaged' if condition == 'Damaged' else 'Available'
            copy.current_borrower_id = None
            copy.current_borrower_name = None
            copy.current_borrower_type = None
            copy.current_borrower_class = None
            copy.issue_date = None
            copy.due_date = None
            copy.save()
        except BookCopy.DoesNotExist:
            pass

        return Response(LoanTransactionSerializer(txn).data)


# ─── Library Receipts ─────────────────────────────────────────────────────────

class LibraryReceiptListCreateView(generics.ListCreateAPIView):
    queryset = LibraryReceipt.objects.prefetch_related('items').order_by('-created_at')
    serializer_class = LibraryReceiptSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['source_type']
    search_fields = ['receipt_no', 'source_name', 'reference']


class LibraryReceiptDetailView(generics.RetrieveAPIView):
    queryset = LibraryReceipt.objects.prefetch_related('items')
    serializer_class = LibraryReceiptSerializer
    lookup_field = 'id'


# ─── Accession Number Helper ──────────────────────────────────────────────────

class NextAccessionView(APIView):
    """GET — returns the next available accession number."""

    def get(self, request):
        year = date.today().year
        last = (
            BookCopy.objects.filter(accession_no__startswith=f'ACC/{year}/')
            .order_by('-accession_no')
            .first()
        )
        num = 1
        if last:
            try:
                num = int(last.accession_no.split('/')[-1]) + 1
            except (ValueError, IndexError):
                num = BookCopy.objects.count() + 1
        return Response({'next': f'ACC/{year}/{num:04d}', 'year': year, 'num': num})


class GenerateAccessionsView(APIView):
    """POST {count} — returns a list of consecutive accession numbers."""

    def post(self, request):
        count = int(request.data.get('count', 1))
        year = date.today().year
        last = (
            BookCopy.objects.filter(accession_no__startswith=f'ACC/{year}/')
            .order_by('-accession_no')
            .first()
        )
        start = 1
        if last:
            try:
                start = int(last.accession_no.split('/')[-1]) + 1
            except (ValueError, IndexError):
                start = BookCopy.objects.count() + 1

        numbers = [f'ACC/{year}/{(start + i):04d}' for i in range(count)]
        return Response({'accession_numbers': numbers})


# ─── Borrowers (derived from loan history) ────────────────────────────────────

class BorrowersView(APIView):
    """GET — returns unique borrowers derived from all loan transactions."""

    def get(self, request):
        seen = {}
        for txn in LoanTransaction.objects.values(
            'borrower_id', 'borrower_name', 'borrower_type', 'borrower_class'
        ).order_by('borrower_name'):
            bid = txn['borrower_id']
            if bid not in seen:
                seen[bid] = {
                    'id': bid,
                    'name': txn['borrower_name'],
                    'type': txn['borrower_type'],
                    'class': txn['borrower_class'] or '',
                }
        return Response(list(seen.values()))


# ─── Legacy ───────────────────────────────────────────────────────────────────

class BookListView(generics.ListAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
