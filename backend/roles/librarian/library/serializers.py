from rest_framework import serializers
from .models import BookTitle, BookCopy, LoanTransaction, LibraryReceipt, LibraryReceiptItem, Book


class BookTitleSerializer(serializers.ModelSerializer):
    copy_count = serializers.SerializerMethodField()
    available_count = serializers.SerializerMethodField()

    class Meta:
        model = BookTitle
        fields = [
            'id', 'title', 'author', 'category', 'isbn',
            'publisher', 'subject', 'year', 'created_at',
            'copy_count', 'available_count',
        ]
        read_only_fields = ['id', 'created_at']

    def get_copy_count(self, obj):
        return obj.copies.count()

    def get_available_count(self, obj):
        return obj.copies.filter(status='Available').count()


class BookCopySerializer(serializers.ModelSerializer):
    title_id = serializers.PrimaryKeyRelatedField(
        source='title_ref', queryset=BookTitle.objects.all(),
        allow_null=True, required=False,
    )

    class Meta:
        model = BookCopy
        fields = [
            'id', 'accession_no', 'title_id',
            'book_title', 'author', 'category', 'isbn',
            'status', 'location', 'received_date', 'receipt_id',
            'status_remarks',
            'current_borrower_id', 'current_borrower_name',
            'current_borrower_type', 'current_borrower_class',
            'issue_date', 'due_date',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class LoanTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanTransaction
        fields = [
            'id', 'transaction_no', 'accession_no',
            'book_title', 'book_author', 'book_category',
            'borrower_id', 'borrower_name', 'borrower_type', 'borrower_class',
            'issue_date', 'due_date', 'return_date', 'return_condition',
            'late_days', 'status', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'transaction_no', 'created_at']


class LibraryReceiptItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryReceiptItem
        fields = ['id', 'title', 'author', 'category', 'isbn', 'quantity_received', 'accession_numbers']
        read_only_fields = ['id']


class LibraryReceiptSerializer(serializers.ModelSerializer):
    items = LibraryReceiptItemSerializer(many=True)

    class Meta:
        model = LibraryReceipt
        fields = [
            'id', 'receipt_no', 'source_type', 'source_name', 'reference',
            'date_received', 'library_branch', 'signed_by', 'signed_at',
            'notes', 'items', 'created_at',
        ]
        read_only_fields = ['id', 'receipt_no', 'created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        receipt = LibraryReceipt.objects.create(**validated_data)
        for item_data in items_data:
            LibraryReceiptItem.objects.create(receipt=receipt, **item_data)
            # Create a BookCopy for each accession number in this item
            for acc_no in item_data.get('accession_numbers', []):
                BookCopy.objects.get_or_create(
                    accession_no=acc_no,
                    defaults={
                        'book_title': item_data['title'],
                        'author': item_data['author'],
                        'category': item_data['category'],
                        'isbn': item_data.get('isbn'),
                        'status': 'Available',
                        'location': receipt.library_branch,
                        'received_date': receipt.date_received,
                        'receipt_id': receipt.id,
                    },
                )
        return receipt


# ── Legacy ────────────────────────────────────────────────────────────────────

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'isbn', 'status']
