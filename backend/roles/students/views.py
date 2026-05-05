import datetime
from decimal import Decimal

from rest_framework import generics, status as http_status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, F, Value, CharField
from django.db.models.functions import Concat

from .models import (
    Student, Distribution, NotCollected, Replacement,
    FeeStructure, FeeStructureItem,
    StudentBill, StudentBillLine,
    Bursary,
)
from .serializers import (
    StudentSerializer, DistributionSerializer,
    NotCollectedSerializer, ReplacementSerializer,
    FeeStructureSerializer, FeeStructureListSerializer,
    StudentBillSerializer,
    BursarySerializer,
)


class StudentListCreateView(generics.ListCreateAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'class_name', 'gender']
    search_fields = ['admission_no', 'first_name', 'last_name']
    ordering_fields = ['class_name', 'last_name', 'admission_no', 'status', 'created_at']


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    lookup_field = 'id'


class StudentLastThreeView(APIView):
    """Returns the last 3 created students (admission_no only) for admission number pattern inference."""
    def get(self, request):
        recent = Student.objects.order_by('-created_at')[:3]
        return Response([{"admission_no": s.admission_no} for s in recent])


# --- Distributions ------------------------------------------------------------

class DistributionRecentView(generics.ListCreateAPIView):
    queryset = Distribution.objects.all()
    serializer_class = DistributionSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'class_name']
    search_fields = ['item_name', 'class_name', 'stream']


class DistributionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Distribution.objects.all()
    serializer_class = DistributionSerializer
    lookup_field = 'id'


class DistributionRegisterView(generics.ListAPIView):
    """Read-only register: only Distributed/Locked records."""
    queryset = Distribution.objects.filter(status__in=['Distributed', 'Locked'])
    serializer_class = DistributionSerializer
    pagination_class = None


class NotCollectedView(generics.ListCreateAPIView):
    queryset = NotCollected.objects.all()
    serializer_class = NotCollectedSerializer
    pagination_class = None
    filter_backends = [SearchFilter]
    search_fields = ['name', 'adm_no', 'class_name', 'item']


class ReplacementView(generics.ListCreateAPIView):
    queryset = Replacement.objects.all()
    serializer_class = ReplacementSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'adm_no', 'item']


class ReplacementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Replacement.objects.all()
    serializer_class = ReplacementSerializer
    lookup_field = 'id'


# ─── Fee Structures ──────────────────────────────────────────────────────────

class FeeStructureListCreateView(generics.ListCreateAPIView):
    queryset = FeeStructure.objects.prefetch_related('items').all()
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active', 'student_category']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return FeeStructureListSerializer
        return FeeStructureSerializer


class FeeStructureDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FeeStructure.objects.prefetch_related('items').all()
    serializer_class = FeeStructureSerializer
    lookup_field = 'id'


# ─── Billing ─────────────────────────────────────────────────────────────────

class StudentBillListView(generics.ListAPIView):
    queryset = StudentBill.objects.select_related('student', 'fee_structure').prefetch_related('lines').all()
    serializer_class = StudentBillSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['term', 'year', 'status']
    search_fields = ['student__admission_no', 'student__first_name', 'student__last_name']


class StudentBillDetailView(generics.RetrieveAPIView):
    queryset = StudentBill.objects.select_related('student', 'fee_structure').prefetch_related('lines').all()
    serializer_class = StudentBillSerializer
    lookup_field = 'id'


class GenerateBillingRunView(APIView):
    """
    POST: Generate bills for all active students from the active fee structure.
    Body: { "term": "T1", "year": "2025", "fee_structure_id": "FS20250001" }
    """
    def post(self, request):
        term = request.data.get('term')
        year = request.data.get('year')
        fs_id = request.data.get('fee_structure_id')

        if not term or not year or not fs_id:
            return Response({'detail': 'term, year, and fee_structure_id are required.'},
                            status=http_status.HTTP_400_BAD_REQUEST)

        try:
            fs = FeeStructure.objects.prefetch_related('items').get(id=fs_id)
        except FeeStructure.DoesNotExist:
            return Response({'detail': 'Fee structure not found.'}, status=http_status.HTTP_404_NOT_FOUND)

        # Term percentage
        pct_map = {'T1': fs.term1_pct, 'T2': fs.term2_pct, 'T3': fs.term3_pct}
        pct = pct_map.get(term)
        if pct is None:
            return Response({'detail': 'Invalid term.'}, status=http_status.HTTP_400_BAD_REQUEST)

        students = Student.objects.filter(status='active')
        # Skip students already billed for this term + fee structure
        already_billed = set(
            StudentBill.objects.filter(fee_structure=fs, term=term)
            .values_list('student_id', flat=True)
        )

        bills_created = 0
        bill_date = datetime.date.today()
        bill_num_start = StudentBill.objects.count() + 1

        for student in students:
            if student.id in already_billed:
                continue

            bill = StudentBill.objects.create(
                student=student,
                fee_structure=fs,
                term=term,
                year=year,
                bill_date=bill_date,
                status='draft',
            )
            bill.bill_number = f'FB-{year}-{term}-{str(bills_created + bill_num_start).zfill(4)}'

            total = Decimal('0')
            for item in fs.items.all():
                amount = (item.annual_amount * pct / 100).quantize(Decimal('1'))
                StudentBillLine.objects.create(
                    bill=bill,
                    vote_head=item.vote_head,
                    amount=amount,
                    paid=Decimal('0'),
                )
                total += amount

            bill.total_amount = total
            bill.save()
            bills_created += 1

        return Response({
            'bills_created': bills_created,
            'term': term,
            'year': year,
            'total_students': bills_created,
        }, status=http_status.HTTP_201_CREATED)


class PostBillingRunView(APIView):
    """POST: Post all draft bills for a given term/year."""
    def post(self, request):
        term = request.data.get('term')
        year = request.data.get('year')
        if not term or not year:
            return Response({'detail': 'term and year are required.'},
                            status=http_status.HTTP_400_BAD_REQUEST)

        updated = StudentBill.objects.filter(term=term, year=year, status='draft').update(status='posted')
        return Response({'posted': updated})


# ─── Student Statement ───────────────────────────────────────────────────────

class StudentBalanceSummaryView(APIView):
    """
    GET /students/balances/
    Returns a summary row per student: total_billed, total_paid, balance, fees_in_advance.
    Query params: ?class_name=Form+3&search=alice
    """
    def get(self, request):
        qs = Student.objects.filter(status='active')

        class_name = request.query_params.get('class_name')
        if class_name:
            qs = qs.filter(class_name=class_name)

        search_q = request.query_params.get('search', '').strip()
        if search_q:
            from django.db.models import Q
            qs = qs.filter(
                Q(admission_no__icontains=search_q) |
                Q(first_name__icontains=search_q) |
                Q(last_name__icontains=search_q)
            )

        # Build entity lookup for receipts
        entity_map = {}  # admission_no → entity_id
        receipt_totals = {}  # entity_id → total
        try:
            from roles.finance.models import Receipt, Entity
            entities = Entity.objects.filter(entity_type='student', is_active=True)
            for e in entities:
                if e.admission_number:
                    entity_map[e.admission_number] = e.pk
            if entity_map:
                from django.db.models import Sum as DSum
                receipt_agg = (
                    Receipt.objects
                    .filter(entity_id__in=entity_map.values(), status='posted')
                    .values('entity_id')
                    .annotate(total=DSum('lines__amount'))
                )
                for row in receipt_agg:
                    receipt_totals[row['entity_id']] = float(row['total'] or 0)
        except Exception:
            pass

        # Build bursary totals
        bursary_totals = {}  # student_id → total
        bursary_agg = (
            Bursary.objects
            .filter(status='received_as_fees')
            .values('student_id')
            .annotate(total=Sum('received_as_fees'))
        )
        for row in bursary_agg:
            bursary_totals[row['student_id']] = float(row['total'] or 0)

        # Build bill totals
        bill_totals = {}  # student_id → total
        bill_agg = (
            StudentBill.objects
            .filter(status='posted')
            .values('student_id')
            .annotate(total=Sum('total_amount'))
        )
        for row in bill_agg:
            bill_totals[row['student_id']] = float(row['total'] or 0)

        # Distinct class names for filter dropdown
        all_classes = list(
            Student.objects.filter(status='active')
            .values_list('class_name', flat=True)
            .distinct()
            .order_by('class_name')
        )

        rows = []
        for student in qs:
            billed = bill_totals.get(student.id, 0)
            entity_id = entity_map.get(student.admission_no)
            receipt_paid = receipt_totals.get(entity_id, 0) if entity_id else 0
            bursary_paid = bursary_totals.get(student.id, 0)
            paid = receipt_paid + bursary_paid
            balance = billed - paid
            fees_in_advance = max(0, -balance)

            rows.append({
                'id': student.id,
                'admission_no': student.admission_no,
                'name': f'{student.first_name} {student.last_name}',
                'class_name': student.class_name,
                'stream': student.stream or '',
                'total_billed': billed,
                'total_paid': paid,
                'balance': balance,
                'outstanding': max(0, balance),
                'fees_in_advance': fees_in_advance,
            })

        return Response({
            'students': rows,
            'classes': all_classes,
        })


class StudentStatementView(APIView):
    """
    GET /students/<student_id>/statement/
    Returns billing + receipt transactions for a student.
    Query params:
      ?term=T1&year=2025  — filter to a specific term
    """
    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=http_status.HTTP_404_NOT_FOUND)

        term_filter = request.query_params.get('term')
        year_filter = request.query_params.get('year')

        # ── Bills ────────────────────────────────────────────────────────────
        bill_qs = StudentBill.objects.filter(student=student, status='posted').prefetch_related('lines')
        if term_filter:
            bill_qs = bill_qs.filter(term=term_filter)
        if year_filter:
            bill_qs = bill_qs.filter(year=year_filter)

        transactions = []
        vote_head_summary = {}  # vote_head → {billed, paid, balance}

        for bill in bill_qs:
            # Bill-level transaction
            bill_lines_detail = []
            for line in bill.lines.all():
                bill_lines_detail.append({
                    'vote_head': line.vote_head,
                    'amount': float(line.amount),
                    'paid': float(line.paid),
                    'balance': float(line.balance),
                })
                # Accumulate vote head summary
                vh = line.vote_head
                if vh not in vote_head_summary:
                    vote_head_summary[vh] = {'billed': 0, 'paid': 0, 'balance': 0}
                vote_head_summary[vh]['billed'] += float(line.amount)
                vote_head_summary[vh]['paid'] += float(line.paid)
                vote_head_summary[vh]['balance'] += float(line.balance)

            transactions.append({
                'date': str(bill.bill_date),
                'ref': bill.bill_number or bill.id,
                'type': 'bill',
                'description': f'{bill.get_term_display()} {bill.year} Billing',
                'debit': float(bill.total_amount),
                'credit': 0,
                'term': bill.term,
                'year': bill.year,
                'lines': bill_lines_detail,
            })

        # ── Receipts from finance module ─────────────────────────────────────
        try:
            from roles.finance.models import Receipt, ReceiptLine, Entity
            entity = Entity.objects.filter(
                entity_type='student',
                admission_number=student.admission_no,
            ).first()
            if entity:
                receipt_qs = Receipt.objects.filter(entity=entity, status='posted').prefetch_related('lines')
                for receipt in receipt_qs:
                    receipt_lines = []
                    for rl in receipt.lines.all():
                        receipt_lines.append({
                            'account': rl.account.name if hasattr(rl.account, 'name') else str(rl.account),
                            'description': rl.description,
                            'amount': float(rl.amount),
                        })
                    transactions.append({
                        'date': str(receipt.receipt_date),
                        'ref': receipt.receipt_number or receipt.id,
                        'type': 'receipt',
                        'description': receipt.narration[:100] if receipt.narration else 'Payment',
                        'debit': 0,
                        'credit': float(receipt.total_amount),
                        'mode': receipt.mode_of_receipt,
                        'lines': receipt_lines,
                    })
        except Exception:
            pass  # Finance module may not be configured

        # ── Bursaries received as fees ───────────────────────────────────────
        bursary_qs = Bursary.objects.filter(student=student, status='received_as_fees')
        for b in bursary_qs:
            if b.received_as_fees > 0:
                transactions.append({
                    'date': str(b.date),
                    'ref': b.bursary_ref or b.id,
                    'type': 'bursary',
                    'description': f'Bursary — {b.sponsor}',
                    'debit': 0,
                    'credit': float(b.received_as_fees),
                    'lines': [],
                })

        # ── Sort and compute running balance ─────────────────────────────────
        transactions.sort(key=lambda t: t['date'])

        balance = 0
        for t in transactions:
            balance += t['debit'] - t['credit']
            t['balance'] = balance

        total_billed = sum(t['debit'] for t in transactions)
        total_paid = sum(t['credit'] for t in transactions)

        # Fees received in advance (negative balance = overpayment)
        fees_in_advance = max(0, -balance)

        # ── Available terms for the filter dropdown ──────────────────────────
        all_bills = StudentBill.objects.filter(student=student, status='posted')
        available_terms = list(
            all_bills.values('term', 'year')
            .distinct()
            .order_by('-year', '-term')
        )

        # ── Vote head summary list ───────────────────────────────────────────
        vote_head_list = [
            {'vote_head': vh, **vals}
            for vh, vals in sorted(vote_head_summary.items())
        ]

        return Response({
            'student': {
                'id': student.id,
                'admission_no': student.admission_no,
                'name': f'{student.first_name} {student.last_name}',
                'class': student.class_name,
                'stream': student.stream or '',
                'status': student.status,
                'parent_name': student.parent_name,
                'parent_phone': student.parent_phone,
            },
            'total_billed': total_billed,
            'total_paid': total_paid,
            'balance': balance,
            'fees_in_advance': fees_in_advance,
            'vote_head_summary': vote_head_list,
            'available_terms': available_terms,
            'transactions': transactions,
        })


# ─── Bursaries ───────────────────────────────────────────────────────────────

class BursaryListCreateView(generics.ListCreateAPIView):
    queryset = Bursary.objects.select_related('student').all()
    serializer_class = BursarySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['bursary_type', 'status']
    search_fields = ['sponsor', 'student__admission_no', 'student__first_name', 'student__last_name']


class BursaryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Bursary.objects.select_related('student').all()
    serializer_class = BursarySerializer
    lookup_field = 'id'
