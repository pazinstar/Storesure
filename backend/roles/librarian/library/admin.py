from django.contrib import admin
from .models import BookTitle, BookCopy, LoanTransaction, LibraryReceipt, LibraryReceiptItem, Book


class BookCopyInline(admin.TabularInline):
    model = BookCopy
    extra = 0
    fields = ['id', 'accession_no', 'status', 'location']
    readonly_fields = ['id']


class LibraryReceiptItemInline(admin.TabularInline):
    model = LibraryReceiptItem
    extra = 0


@admin.register(BookTitle)
class BookTitleAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'author', 'category', 'subject', 'year']
    list_filter = ['category', 'subject']
    search_fields = ['id', 'title', 'author', 'isbn']
    readonly_fields = ['id', 'created_at']
    inlines = [BookCopyInline]


@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = ['id', 'accession_no', 'book_title', 'author', 'category', 'status', 'location']
    list_filter = ['category', 'status']
    search_fields = ['id', 'accession_no', 'book_title', 'author', 'isbn']
    readonly_fields = ['id', 'created_at']


@admin.register(LoanTransaction)
class LoanTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'transaction_no', 'book_title', 'borrower_name', 'borrower_type', 'issue_date', 'due_date', 'return_date', 'status']
    list_filter = ['status', 'borrower_type', 'book_category']
    search_fields = ['id', 'transaction_no', 'book_title', 'borrower_name', 'borrower_id', 'accession_no']
    readonly_fields = ['id', 'created_at']
    date_hierarchy = 'issue_date'


@admin.register(LibraryReceipt)
class LibraryReceiptAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']
    inlines = [LibraryReceiptItemInline]


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['id']
    search_fields = ['id']
    readonly_fields = ['id']
