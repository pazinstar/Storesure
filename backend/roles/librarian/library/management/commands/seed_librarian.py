from datetime import date, timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from roles.librarian.dashboard.models import LibrarianKPI
from roles.librarian.library.models import (
    Book, BookTitle, BookCopy, LoanTransaction, LibraryReceipt, LibraryReceiptItem,
)

TODAY = date.today()
YEAR = TODAY.year


def d(days_ago):
    return TODAY - timedelta(days=days_ago)


class Command(BaseCommand):
    help = 'Seeds the database with comprehensive library data for reports'

    def handle(self, *args, **kwargs):
        self.stdout.write('-- Clearing existing library data ...')
        LibrarianKPI.objects.all().delete()
        LoanTransaction.objects.all().delete()
        BookCopy.objects.all().delete()
        LibraryReceiptItem.objects.all().delete()
        LibraryReceipt.objects.all().delete()
        BookTitle.objects.all().delete()
        Book.objects.all().delete()

        # -- KPIs --------------------------------------------------------------
        self.stdout.write('Seeding KPIs ...')
        for kpi in [
            {'title': 'Total Copies',       'value': '52', 'trend': '+12 this term',       'trendUp': True,  'type': 'Book'},
            {'title': 'Active Loans',        'value': '8',  'trend': '3 overdue',           'trendUp': False, 'type': 'Users'},
            {'title': 'Lost / Damaged',      'value': '4',  'trend': 'Requires action',     'trendUp': False, 'type': 'AlertTriangle'},
            {'title': 'Titles in Catalogue', 'value': '12', 'trend': 'Across all shelves',  'trendUp': True,  'type': 'BookOpen'},
        ]:
            LibrarianKPI.objects.create(**kpi)

        # -- Book Titles --------------------------------------------------------
        self.stdout.write('Seeding Book Titles ...')
        titles = [
            BookTitle(id='BTL001', title='Mathematics Form 3',              author='KICD',                  category='Textbook',   isbn='978-9966-001-01', publisher='KLB',                    subject='Mathematics', year=2023),
            BookTitle(id='BTL002', title='Biology for Secondary Schools',   author='KICD',                  category='Textbook',   isbn='978-9966-001-02', publisher='Longhorn',               subject='Biology',     year=2023),
            BookTitle(id='BTL003', title='A History of Kenya',              author='Prof. Bethwell Ogot',   category='Reference',  isbn='978-9966-001-03', publisher='East African Publishers', subject='History',     year=2020),
            BookTitle(id='BTL004', title='Kiswahili Fasihi',                author='Various Authors',       category='Textbook',   isbn='978-9966-001-04', publisher='Oxford',                 subject='Kiswahili',   year=2022),
            BookTitle(id='BTL005', title='Physics Practical Guide',         author='Dr. James Mwangi',      category='Reference',  isbn='978-9966-001-05', publisher='Focus Publishers',       subject='Physics',     year=2021),
            BookTitle(id='BTL006', title='Things Fall Apart',               author='Chinua Achebe',         category='Fiction',    isbn='978-0-385-47454-2', publisher='Heinemann',            subject='Literature',  year=2019),
            BookTitle(id='BTL007', title='Chemistry Form 4',                author='KICD',                  category='Textbook',   isbn='978-9966-001-07', publisher='KLB',                    subject='Chemistry',   year=2023),
            BookTitle(id='BTL008', title='English Language & Composition',  author='Oxford',                category='Textbook',   isbn='978-9966-001-08', publisher='Oxford',                 subject='English',     year=2022),
            BookTitle(id='BTL009', title='Geography of East Africa',        author='P. O. Ochieng',         category='Textbook',   isbn='978-9966-001-09', publisher='East African Publishers', subject='Geography',   year=2021),
            BookTitle(id='BTL010', title='Weep Not Child',                  author='Ngũgĩ wa Thiong\'o',   category='Fiction',    isbn='978-0-14-303510-1', publisher='Penguin',              subject='Literature',  year=2018),
            BookTitle(id='BTL011', title='CRE For Secondary Schools',       author='Various',               category='Textbook',   isbn='978-9966-001-11', publisher='Longhorn',               subject='CRE',         year=2022),
            BookTitle(id='BTL012', title='Business Studies Form 1–4',       author='KICD',                  category='Textbook',   isbn='978-9966-001-12', publisher='KLB',                    subject='Business',    year=2023),
        ]
        BookTitle.objects.bulk_create(titles)

        # -- Library Receipts ---------------------------------------------------
        self.stdout.write('Seeding Receipts ...')

        r1 = LibraryReceipt.objects.create(
            id='RCT001', receipt_no=f'LRN/{YEAR}/0001',
            source_type='Supplier', source_name='Kenya Literature Bureau',
            reference='LPO/2024/001', date_received=d(300),
            library_branch='Main Library', signed_by='James Wachira',
            signed_at=timezone.make_aware(timezone.datetime(d(300).year, d(300).month, d(300).day, 10, 0)),
        )
        LibraryReceiptItem.objects.create(
            receipt=r1, title='Mathematics Form 3', author='KICD',
            category='Textbook', isbn='978-9966-001-01', quantity_received=5,
            accession_numbers=[f'ACC/{YEAR}/0001', f'ACC/{YEAR}/0002', f'ACC/{YEAR}/0003', f'ACC/{YEAR}/0004', f'ACC/{YEAR}/0005'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r1, title='Biology for Secondary Schools', author='KICD',
            category='Textbook', isbn='978-9966-001-02', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0006', f'ACC/{YEAR}/0007', f'ACC/{YEAR}/0008', f'ACC/{YEAR}/0009'],
        )

        r2 = LibraryReceipt.objects.create(
            id='RCT002', receipt_no=f'LRN/{YEAR}/0002',
            source_type='Supplier', source_name='Longhorn Publishers',
            reference='LPO/2024/005', date_received=d(200),
            library_branch='Science Wing', signed_by='Grace Akinyi',
            signed_at=timezone.make_aware(timezone.datetime(d(200).year, d(200).month, d(200).day, 10, 0)),
        )
        LibraryReceiptItem.objects.create(
            receipt=r2, title='Chemistry Form 4', author='KICD',
            category='Textbook', isbn='978-9966-001-07', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0010', f'ACC/{YEAR}/0011', f'ACC/{YEAR}/0012', f'ACC/{YEAR}/0013'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r2, title='Physics Practical Guide', author='Dr. James Mwangi',
            category='Reference', isbn='978-9966-001-05', quantity_received=3,
            accession_numbers=[f'ACC/{YEAR}/0014', f'ACC/{YEAR}/0015', f'ACC/{YEAR}/0016'],
        )

        r3 = LibraryReceipt.objects.create(
            id='RCT003', receipt_no=f'LRN/{YEAR}/0003',
            source_type='Donor', source_name='Parents Association',
            reference=None, date_received=d(150),
            library_branch='Main Library', signed_by='Mary Njoroge',
            signed_at=timezone.make_aware(timezone.datetime(d(150).year, d(150).month, d(150).day, 9, 30)),
            notes='Donated books from Class of 2023 leavers',
        )
        LibraryReceiptItem.objects.create(
            receipt=r3, title='A History of Kenya', author='Prof. Bethwell Ogot',
            category='Reference', isbn='978-9966-001-03', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0017', f'ACC/{YEAR}/0018', f'ACC/{YEAR}/0019', f'ACC/{YEAR}/0020'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r3, title='Things Fall Apart', author='Chinua Achebe',
            category='Fiction', isbn='978-0-385-47454-2', quantity_received=3,
            accession_numbers=[f'ACC/{YEAR}/0021', f'ACC/{YEAR}/0022', f'ACC/{YEAR}/0023'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r3, title='Weep Not Child', author="Ngũgĩ wa Thiong'o",
            category='Fiction', isbn='978-0-14-303510-1', quantity_received=3,
            accession_numbers=[f'ACC/{YEAR}/0024', f'ACC/{YEAR}/0025', f'ACC/{YEAR}/0026'],
        )

        r4 = LibraryReceipt.objects.create(
            id='RCT004', receipt_no=f'LRN/{YEAR}/0004',
            source_type='Supplier', source_name='Oxford University Press EA',
            reference='LPO/2024/012', date_received=d(90),
            library_branch='Main Library', signed_by='James Wachira',
            signed_at=timezone.make_aware(timezone.datetime(d(90).year, d(90).month, d(90).day, 11, 0)),
        )
        LibraryReceiptItem.objects.create(
            receipt=r4, title='English Language & Composition', author='Oxford',
            category='Textbook', isbn='978-9966-001-08', quantity_received=5,
            accession_numbers=[f'ACC/{YEAR}/0027', f'ACC/{YEAR}/0028', f'ACC/{YEAR}/0029', f'ACC/{YEAR}/0030', f'ACC/{YEAR}/0031'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r4, title='Kiswahili Fasihi', author='Various Authors',
            category='Textbook', isbn='978-9966-001-04', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0032', f'ACC/{YEAR}/0033', f'ACC/{YEAR}/0034', f'ACC/{YEAR}/0035'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r4, title='Geography of East Africa', author='P. O. Ochieng',
            category='Textbook', isbn='978-9966-001-09', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0036', f'ACC/{YEAR}/0037', f'ACC/{YEAR}/0038', f'ACC/{YEAR}/0039'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r4, title='Business Studies Form 1–4', author='KICD',
            category='Textbook', isbn='978-9966-001-12', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0040', f'ACC/{YEAR}/0041', f'ACC/{YEAR}/0042', f'ACC/{YEAR}/0043'],
        )
        LibraryReceiptItem.objects.create(
            receipt=r4, title='CRE For Secondary Schools', author='Various',
            category='Textbook', isbn='978-9966-001-11', quantity_received=4,
            accession_numbers=[f'ACC/{YEAR}/0044', f'ACC/{YEAR}/0045', f'ACC/{YEAR}/0046', f'ACC/{YEAR}/0047'],
        )

        # -- Book Copies --------------------------------------------------------
        self.stdout.write('Seeding Book Copies ...')

        copies = [
            # -- Mathematics Form 3 (5 copies) ---------------------------------
            BookCopy(id='CPY001', accession_no=f'ACC/{YEAR}/0001', title_ref_id='BTL001',
                     book_title='Mathematics Form 3', author='KICD', category='Textbook',
                     isbn='978-9966-001-01', status='Available',
                     location='Main Library', received_date=d(300), receipt_id='RCT001'),
            BookCopy(id='CPY002', accession_no=f'ACC/{YEAR}/0002', title_ref_id='BTL001',
                     book_title='Mathematics Form 3', author='KICD', category='Textbook',
                     isbn='978-9966-001-01', status='Issued',
                     location='Main Library', received_date=d(300), receipt_id='RCT001',
                     current_borrower_id='2024/001', current_borrower_name='John Kamau',
                     current_borrower_type='Student', current_borrower_class='Form 3A',
                     issue_date=d(14), due_date=d(-2)),
            BookCopy(id='CPY003', accession_no=f'ACC/{YEAR}/0003', title_ref_id='BTL001',
                     book_title='Mathematics Form 3', author='KICD', category='Textbook',
                     isbn='978-9966-001-01', status='Available',
                     location='Main Library', received_date=d(300), receipt_id='RCT001'),
            BookCopy(id='CPY004', accession_no=f'ACC/{YEAR}/0004', title_ref_id='BTL001',
                     book_title='Mathematics Form 3', author='KICD', category='Textbook',
                     isbn='978-9966-001-01', status='Damaged',
                     location='Main Library', received_date=d(300), receipt_id='RCT001',
                     status_remarks='Cover torn, pages water-damaged'),
            BookCopy(id='CPY005', accession_no=f'ACC/{YEAR}/0005', title_ref_id='BTL001',
                     book_title='Mathematics Form 3', author='KICD', category='Textbook',
                     isbn='978-9966-001-01', status='Available',
                     location='Main Library', received_date=d(300), receipt_id='RCT001'),

            # -- Biology (4 copies) ---------------------------------------------
            BookCopy(id='CPY006', accession_no=f'ACC/{YEAR}/0006', title_ref_id='BTL002',
                     book_title='Biology for Secondary Schools', author='KICD', category='Textbook',
                     isbn='978-9966-001-02', status='Available',
                     location='Science Wing', received_date=d(300), receipt_id='RCT001'),
            BookCopy(id='CPY007', accession_no=f'ACC/{YEAR}/0007', title_ref_id='BTL002',
                     book_title='Biology for Secondary Schools', author='KICD', category='Textbook',
                     isbn='978-9966-001-02', status='Overdue',
                     location='Science Wing', received_date=d(300), receipt_id='RCT001',
                     current_borrower_id='2024/045', current_borrower_name='Mary Wanjiku',
                     current_borrower_type='Student', current_borrower_class='Form 4B',
                     issue_date=d(30), due_date=d(16)),
            BookCopy(id='CPY008', accession_no=f'ACC/{YEAR}/0008', title_ref_id='BTL002',
                     book_title='Biology for Secondary Schools', author='KICD', category='Textbook',
                     isbn='978-9966-001-02', status='Issued',
                     location='Science Wing', received_date=d(300), receipt_id='RCT001',
                     current_borrower_id='TSC001234', current_borrower_name='Mr. John Mwangi',
                     current_borrower_type='Staff', current_borrower_class='Mathematics Dept',
                     issue_date=d(7), due_date=d(-7)),
            BookCopy(id='CPY009', accession_no=f'ACC/{YEAR}/0009', title_ref_id='BTL002',
                     book_title='Biology for Secondary Schools', author='KICD', category='Textbook',
                     isbn='978-9966-001-02', status='Available',
                     location='Science Wing', received_date=d(300), receipt_id='RCT001'),

            # -- Chemistry (4 copies) -------------------------------------------
            BookCopy(id='CPY010', accession_no=f'ACC/{YEAR}/0010', title_ref_id='BTL007',
                     book_title='Chemistry Form 4', author='KICD', category='Textbook',
                     isbn='978-9966-001-07', status='Available',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002'),
            BookCopy(id='CPY011', accession_no=f'ACC/{YEAR}/0011', title_ref_id='BTL007',
                     book_title='Chemistry Form 4', author='KICD', category='Textbook',
                     isbn='978-9966-001-07', status='Issued',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002',
                     current_borrower_id='2024/088', current_borrower_name='Peter Njoroge',
                     current_borrower_type='Student', current_borrower_class='Form 4A',
                     issue_date=d(10), due_date=d(4)),
            BookCopy(id='CPY012', accession_no=f'ACC/{YEAR}/0012', title_ref_id='BTL007',
                     book_title='Chemistry Form 4', author='KICD', category='Textbook',
                     isbn='978-9966-001-07', status='Available',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002'),
            BookCopy(id='CPY013', accession_no=f'ACC/{YEAR}/0013', title_ref_id='BTL007',
                     book_title='Chemistry Form 4', author='KICD', category='Textbook',
                     isbn='978-9966-001-07', status='Lost',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002',
                     status_remarks='Borrower left school without returning'),

            # -- Physics Practical Guide (3 copies) ----------------------------
            BookCopy(id='CPY014', accession_no=f'ACC/{YEAR}/0014', title_ref_id='BTL005',
                     book_title='Physics Practical Guide', author='Dr. James Mwangi', category='Reference',
                     isbn='978-9966-001-05', status='Available',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002'),
            BookCopy(id='CPY015', accession_no=f'ACC/{YEAR}/0015', title_ref_id='BTL005',
                     book_title='Physics Practical Guide', author='Dr. James Mwangi', category='Reference',
                     isbn='978-9966-001-05', status='Overdue',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002',
                     current_borrower_id='2024/102', current_borrower_name='Grace Njoki',
                     current_borrower_type='Student', current_borrower_class='Form 3B',
                     issue_date=d(25), due_date=d(11)),
            BookCopy(id='CPY016', accession_no=f'ACC/{YEAR}/0016', title_ref_id='BTL005',
                     book_title='Physics Practical Guide', author='Dr. James Mwangi', category='Reference',
                     isbn='978-9966-001-05', status='Available',
                     location='Science Wing', received_date=d(200), receipt_id='RCT002'),

            # -- A History of Kenya (4 copies) ---------------------------------
            BookCopy(id='CPY017', accession_no=f'ACC/{YEAR}/0017', title_ref_id='BTL003',
                     book_title='A History of Kenya', author='Prof. Bethwell Ogot', category='Reference',
                     isbn='978-9966-001-03', status='Available',
                     location='Main Library', received_date=d(150), receipt_id='RCT003'),
            BookCopy(id='CPY018', accession_no=f'ACC/{YEAR}/0018', title_ref_id='BTL003',
                     book_title='A History of Kenya', author='Prof. Bethwell Ogot', category='Reference',
                     isbn='978-9966-001-03', status='Issued',
                     location='Main Library', received_date=d(150), receipt_id='RCT003',
                     current_borrower_id='2024/120', current_borrower_name='Samuel Omondi',
                     current_borrower_type='Student', current_borrower_class='Form 2C',
                     issue_date=d(5), due_date=d(9)),
            BookCopy(id='CPY019', accession_no=f'ACC/{YEAR}/0019', title_ref_id='BTL003',
                     book_title='A History of Kenya', author='Prof. Bethwell Ogot', category='Reference',
                     isbn='978-9966-001-03', status='Available',
                     location='Main Library', received_date=d(150), receipt_id='RCT003'),
            BookCopy(id='CPY020', accession_no=f'ACC/{YEAR}/0020', title_ref_id='BTL003',
                     book_title='A History of Kenya', author='Prof. Bethwell Ogot', category='Reference',
                     isbn='978-9966-001-03', status='Overdue',
                     location='Main Library', received_date=d(150), receipt_id='RCT003',
                     current_borrower_id='2024/055', current_borrower_name='Fatuma Hassan',
                     current_borrower_type='Student', current_borrower_class='Form 3C',
                     issue_date=d(35), due_date=d(21)),

            # -- Fiction (3 + 3 copies) -----------------------------------------
            BookCopy(id='CPY021', accession_no=f'ACC/{YEAR}/0021', title_ref_id='BTL006',
                     book_title='Things Fall Apart', author='Chinua Achebe', category='Fiction',
                     isbn='978-0-385-47454-2', status='Available',
                     location='Main Library', received_date=d(150), receipt_id='RCT003'),
            BookCopy(id='CPY022', accession_no=f'ACC/{YEAR}/0022', title_ref_id='BTL006',
                     book_title='Things Fall Apart', author='Chinua Achebe', category='Fiction',
                     isbn='978-0-385-47454-2', status='Issued',
                     location='Main Library', received_date=d(150), receipt_id='RCT003',
                     current_borrower_id='2024/077', current_borrower_name='Diana Achieng',
                     current_borrower_type='Student', current_borrower_class='Form 4C',
                     issue_date=d(8), due_date=d(6)),
            BookCopy(id='CPY023', accession_no=f'ACC/{YEAR}/0023', title_ref_id='BTL006',
                     book_title='Things Fall Apart', author='Chinua Achebe', category='Fiction',
                     isbn='978-0-385-47454-2', status='Damaged',
                     location='Main Library', received_date=d(150), receipt_id='RCT003',
                     status_remarks='Spine broken, several pages loose'),
            BookCopy(id='CPY024', accession_no=f'ACC/{YEAR}/0024', title_ref_id='BTL010',
                     book_title="Weep Not Child", author="Ngũgĩ wa Thiong'o", category='Fiction',
                     isbn='978-0-14-303510-1', status='Available',
                     location='Main Library', received_date=d(150), receipt_id='RCT003'),
            BookCopy(id='CPY025', accession_no=f'ACC/{YEAR}/0025', title_ref_id='BTL010',
                     book_title="Weep Not Child", author="Ngũgĩ wa Thiong'o", category='Fiction',
                     isbn='978-0-14-303510-1', status='Available',
                     location='Main Library', received_date=d(150), receipt_id='RCT003'),
            BookCopy(id='CPY026', accession_no=f'ACC/{YEAR}/0026', title_ref_id='BTL010',
                     book_title="Weep Not Child", author="Ngũgĩ wa Thiong'o", category='Fiction',
                     isbn='978-0-14-303510-1', status='Issued',
                     location='Main Library', received_date=d(150), receipt_id='RCT003',
                     current_borrower_id='TSC002345', current_borrower_name='Ms. Mary Wanjiru',
                     current_borrower_type='Staff', current_borrower_class='Languages Dept',
                     issue_date=d(3), due_date=d(11)),

            # -- English, Kiswahili, Geography, Business, CRE (new receipt) ------
            BookCopy(id='CPY027', accession_no=f'ACC/{YEAR}/0027', title_ref_id='BTL008',
                     book_title='English Language & Composition', author='Oxford', category='Textbook',
                     isbn='978-9966-001-08', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY028', accession_no=f'ACC/{YEAR}/0028', title_ref_id='BTL008',
                     book_title='English Language & Composition', author='Oxford', category='Textbook',
                     isbn='978-9966-001-08', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY029', accession_no=f'ACC/{YEAR}/0029', title_ref_id='BTL008',
                     book_title='English Language & Composition', author='Oxford', category='Textbook',
                     isbn='978-9966-001-08', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY030', accession_no=f'ACC/{YEAR}/0030', title_ref_id='BTL008',
                     book_title='English Language & Composition', author='Oxford', category='Textbook',
                     isbn='978-9966-001-08', status='Issued',
                     location='Main Library', received_date=d(90), receipt_id='RCT004',
                     current_borrower_id='2024/033', current_borrower_name='Kevin Otieno',
                     current_borrower_type='Student', current_borrower_class='Form 1A',
                     issue_date=d(6), due_date=d(8)),
            BookCopy(id='CPY031', accession_no=f'ACC/{YEAR}/0031', title_ref_id='BTL008',
                     book_title='English Language & Composition', author='Oxford', category='Textbook',
                     isbn='978-9966-001-08', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY032', accession_no=f'ACC/{YEAR}/0032', title_ref_id='BTL004',
                     book_title='Kiswahili Fasihi', author='Various Authors', category='Textbook',
                     isbn='978-9966-001-04', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY033', accession_no=f'ACC/{YEAR}/0033', title_ref_id='BTL004',
                     book_title='Kiswahili Fasihi', author='Various Authors', category='Textbook',
                     isbn='978-9966-001-04', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY034', accession_no=f'ACC/{YEAR}/0034', title_ref_id='BTL004',
                     book_title='Kiswahili Fasihi', author='Various Authors', category='Textbook',
                     isbn='978-9966-001-04', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY035', accession_no=f'ACC/{YEAR}/0035', title_ref_id='BTL004',
                     book_title='Kiswahili Fasihi', author='Various Authors', category='Textbook',
                     isbn='978-9966-001-04', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY036', accession_no=f'ACC/{YEAR}/0036', title_ref_id='BTL009',
                     book_title='Geography of East Africa', author='P. O. Ochieng', category='Textbook',
                     isbn='978-9966-001-09', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY037', accession_no=f'ACC/{YEAR}/0037', title_ref_id='BTL009',
                     book_title='Geography of East Africa', author='P. O. Ochieng', category='Textbook',
                     isbn='978-9966-001-09', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY038', accession_no=f'ACC/{YEAR}/0038', title_ref_id='BTL009',
                     book_title='Geography of East Africa', author='P. O. Ochieng', category='Textbook',
                     isbn='978-9966-001-09', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY039', accession_no=f'ACC/{YEAR}/0039', title_ref_id='BTL009',
                     book_title='Geography of East Africa', author='P. O. Ochieng', category='Textbook',
                     isbn='978-9966-001-09', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY040', accession_no=f'ACC/{YEAR}/0040', title_ref_id='BTL012',
                     book_title='Business Studies Form 1–4', author='KICD', category='Textbook',
                     isbn='978-9966-001-12', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY041', accession_no=f'ACC/{YEAR}/0041', title_ref_id='BTL012',
                     book_title='Business Studies Form 1–4', author='KICD', category='Textbook',
                     isbn='978-9966-001-12', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY042', accession_no=f'ACC/{YEAR}/0042', title_ref_id='BTL012',
                     book_title='Business Studies Form 1–4', author='KICD', category='Textbook',
                     isbn='978-9966-001-12', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY043', accession_no=f'ACC/{YEAR}/0043', title_ref_id='BTL012',
                     book_title='Business Studies Form 1–4', author='KICD', category='Textbook',
                     isbn='978-9966-001-12', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY044', accession_no=f'ACC/{YEAR}/0044', title_ref_id='BTL011',
                     book_title='CRE For Secondary Schools', author='Various', category='Textbook',
                     isbn='978-9966-001-11', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY045', accession_no=f'ACC/{YEAR}/0045', title_ref_id='BTL011',
                     book_title='CRE For Secondary Schools', author='Various', category='Textbook',
                     isbn='978-9966-001-11', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY046', accession_no=f'ACC/{YEAR}/0046', title_ref_id='BTL011',
                     book_title='CRE For Secondary Schools', author='Various', category='Textbook',
                     isbn='978-9966-001-11', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
            BookCopy(id='CPY047', accession_no=f'ACC/{YEAR}/0047', title_ref_id='BTL011',
                     book_title='CRE For Secondary Schools', author='Various', category='Textbook',
                     isbn='978-9966-001-11', status='Available',
                     location='Main Library', received_date=d(90), receipt_id='RCT004'),
        ]
        BookCopy.objects.bulk_create(copies)

        # -- Loan Transactions --------------------------------------------------
        self.stdout.write('Seeding Loan Transactions ...')

        loans = [
            # Active loans (currently out)
            LoanTransaction(
                id='TXN001', transaction_no=f'TXN/{YEAR}/0001',
                accession_no=f'ACC/{YEAR}/0002', book_title='Mathematics Form 3',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/001', borrower_name='John Kamau',
                borrower_type='Student', borrower_class='Form 3A',
                issue_date=d(14), due_date=d(-2), status='Active',
            ),
            LoanTransaction(
                id='TXN002', transaction_no=f'TXN/{YEAR}/0002',
                accession_no=f'ACC/{YEAR}/0008', book_title='Biology for Secondary Schools',
                book_author='KICD', book_category='Textbook',
                borrower_id='TSC001234', borrower_name='Mr. John Mwangi',
                borrower_type='Staff', borrower_class='Mathematics Dept',
                issue_date=d(7), due_date=d(-7), status='Active',
            ),
            LoanTransaction(
                id='TXN003', transaction_no=f'TXN/{YEAR}/0003',
                accession_no=f'ACC/{YEAR}/0011', book_title='Chemistry Form 4',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/088', borrower_name='Peter Njoroge',
                borrower_type='Student', borrower_class='Form 4A',
                issue_date=d(10), due_date=d(4), status='Active',
            ),
            LoanTransaction(
                id='TXN004', transaction_no=f'TXN/{YEAR}/0004',
                accession_no=f'ACC/{YEAR}/0018', book_title='A History of Kenya',
                book_author='Prof. Bethwell Ogot', book_category='Reference',
                borrower_id='2024/120', borrower_name='Samuel Omondi',
                borrower_type='Student', borrower_class='Form 2C',
                issue_date=d(5), due_date=d(9), status='Active',
            ),
            LoanTransaction(
                id='TXN005', transaction_no=f'TXN/{YEAR}/0005',
                accession_no=f'ACC/{YEAR}/0022', book_title='Things Fall Apart',
                book_author='Chinua Achebe', book_category='Fiction',
                borrower_id='2024/077', borrower_name='Diana Achieng',
                borrower_type='Student', borrower_class='Form 4C',
                issue_date=d(8), due_date=d(6), status='Active',
            ),
            LoanTransaction(
                id='TXN006', transaction_no=f'TXN/{YEAR}/0006',
                accession_no=f'ACC/{YEAR}/0026', book_title="Weep Not Child",
                book_author="Ngũgĩ wa Thiong'o", book_category='Fiction',
                borrower_id='TSC002345', borrower_name='Ms. Mary Wanjiru',
                borrower_type='Staff', borrower_class='Languages Dept',
                issue_date=d(3), due_date=d(11), status='Active',
            ),
            LoanTransaction(
                id='TXN007', transaction_no=f'TXN/{YEAR}/0007',
                accession_no=f'ACC/{YEAR}/0030', book_title='English Language & Composition',
                book_author='Oxford', book_category='Textbook',
                borrower_id='2024/033', borrower_name='Kevin Otieno',
                borrower_type='Student', borrower_class='Form 1A',
                issue_date=d(6), due_date=d(8), status='Active',
            ),
            # Overdue loans
            LoanTransaction(
                id='TXN008', transaction_no=f'TXN/{YEAR}/0008',
                accession_no=f'ACC/{YEAR}/0007', book_title='Biology for Secondary Schools',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/045', borrower_name='Mary Wanjiku',
                borrower_type='Student', borrower_class='Form 4B',
                issue_date=d(30), due_date=d(16), status='Overdue',
            ),
            LoanTransaction(
                id='TXN009', transaction_no=f'TXN/{YEAR}/0009',
                accession_no=f'ACC/{YEAR}/0015', book_title='Physics Practical Guide',
                book_author='Dr. James Mwangi', book_category='Reference',
                borrower_id='2024/102', borrower_name='Grace Njoki',
                borrower_type='Student', borrower_class='Form 3B',
                issue_date=d(25), due_date=d(11), status='Overdue',
            ),
            LoanTransaction(
                id='TXN010', transaction_no=f'TXN/{YEAR}/0010',
                accession_no=f'ACC/{YEAR}/0020', book_title='A History of Kenya',
                book_author='Prof. Bethwell Ogot', book_category='Reference',
                borrower_id='2024/055', borrower_name='Fatuma Hassan',
                borrower_type='Student', borrower_class='Form 3C',
                issue_date=d(35), due_date=d(21), status='Overdue',
            ),
            # Returned loans
            LoanTransaction(
                id='TXN011', transaction_no=f'TXN/{YEAR}/0011',
                accession_no=f'ACC/{YEAR}/0003', book_title='Mathematics Form 3',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/067', borrower_name='James Mwangi',
                borrower_type='Student', borrower_class='Form 4A',
                issue_date=d(30), due_date=d(16), return_date=d(18),
                return_condition='Good', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN012', transaction_no=f'TXN/{YEAR}/0012',
                accession_no=f'ACC/{YEAR}/0006', book_title='Biology for Secondary Schools',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/078', borrower_name='Alice Njeri',
                borrower_type='Student', borrower_class='Form 3A',
                issue_date=d(45), due_date=d(31), return_date=d(33),
                return_condition='Good', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN013', transaction_no=f'TXN/{YEAR}/0013',
                accession_no=f'ACC/{YEAR}/0014', book_title='Physics Practical Guide',
                book_author='Dr. James Mwangi', book_category='Reference',
                borrower_id='TSC001234', borrower_name='Mr. John Mwangi',
                borrower_type='Staff', borrower_class='Mathematics Dept',
                issue_date=d(60), due_date=d(46), return_date=d(49),
                return_condition='Fair', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN014', transaction_no=f'TXN/{YEAR}/0014',
                accession_no=f'ACC/{YEAR}/0017', book_title='A History of Kenya',
                book_author='Prof. Bethwell Ogot', book_category='Reference',
                borrower_id='2024/090', borrower_name='Brian Kipchoge',
                borrower_type='Student', borrower_class='Form 2A',
                issue_date=d(50), due_date=d(36), return_date=d(38),
                return_condition='Good', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN015', transaction_no=f'TXN/{YEAR}/0015',
                accession_no=f'ACC/{YEAR}/0021', book_title='Things Fall Apart',
                book_author='Chinua Achebe', book_category='Fiction',
                borrower_id='2024/111', borrower_name='Sarah Chebet',
                borrower_type='Student', borrower_class='Form 4B',
                issue_date=d(40), due_date=d(26), return_date=d(24),
                return_condition='Good', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN016', transaction_no=f'TXN/{YEAR}/0016',
                accession_no=f'ACC/{YEAR}/0009', book_title='Biology for Secondary Schools',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/055', borrower_name='Fatuma Hassan',
                borrower_type='Student', borrower_class='Form 3C',
                issue_date=d(70), due_date=d(56), return_date=d(53),
                return_condition='Good', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN017', transaction_no=f'TXN/{YEAR}/0017',
                accession_no=f'ACC/{YEAR}/0010', book_title='Chemistry Form 4',
                book_author='KICD', book_category='Textbook',
                borrower_id='2024/099', borrower_name='Daniel Mutua',
                borrower_type='Student', borrower_class='Form 4A',
                issue_date=d(55), due_date=d(41), return_date=d(45),
                return_condition='Good', late_days=4, status='Returned',
            ),
            LoanTransaction(
                id='TXN018', transaction_no=f'TXN/{YEAR}/0018',
                accession_no=f'ACC/{YEAR}/0024', book_title="Weep Not Child",
                book_author="Ngũgĩ wa Thiong'o", book_category='Fiction',
                borrower_id='2024/130', borrower_name='Esther Muli',
                borrower_type='Student', borrower_class='Form 3A',
                issue_date=d(80), due_date=d(66), return_date=d(68),
                return_condition='Good', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN019', transaction_no=f'TXN/{YEAR}/0019',
                accession_no=f'ACC/{YEAR}/0025', book_title="Weep Not Child",
                book_author="Ngũgĩ wa Thiong'o", book_category='Fiction',
                borrower_id='2024/145', borrower_name='Moses Kimani',
                borrower_type='Student', borrower_class='Form 3B',
                issue_date=d(65), due_date=d(51), return_date=d(48),
                return_condition='Fair', late_days=0, status='Returned',
            ),
            LoanTransaction(
                id='TXN020', transaction_no=f'TXN/{YEAR}/0020',
                accession_no=f'ACC/{YEAR}/0027', book_title='English Language & Composition',
                book_author='Oxford', book_category='Textbook',
                borrower_id='TSC002345', borrower_name='Ms. Mary Wanjiru',
                borrower_type='Staff', borrower_class='Languages Dept',
                issue_date=d(90), due_date=d(76), return_date=d(80),
                return_condition='Good', late_days=0, status='Returned',
            ),
        ]
        LoanTransaction.objects.bulk_create(loans)

        # Summary
        total = BookCopy.objects.count()
        active = LoanTransaction.objects.filter(status='Active').count()
        overdue = LoanTransaction.objects.filter(status='Overdue').count()
        returned = LoanTransaction.objects.filter(status='Returned').count()
        lost = BookCopy.objects.filter(status='Lost').count()
        damaged = BookCopy.objects.filter(status='Damaged').count()

        self.stdout.write(self.style.SUCCESS(
            f'\nLibrary seeded successfully.\n'
            f'   {total} book copies | {active} active loans | {overdue} overdue | '
            f'{returned} returned | {lost} lost | {damaged} damaged'
        ))
