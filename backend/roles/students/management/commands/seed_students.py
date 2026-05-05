from datetime import date, timedelta
from django.core.management.base import BaseCommand
from roles.students.models import Student, Distribution, NotCollected, Replacement

TODAY = date.today()
YEAR = TODAY.year


def d(days_ago):
    return TODAY - timedelta(days=days_ago)


class Command(BaseCommand):
    help = 'Seeds the database with comprehensive student data'

    def handle(self, *args, **kwargs):
        self.stdout.write('-- Clearing existing student data ...')
        Replacement.objects.all().delete()
        NotCollected.objects.all().delete()
        Distribution.objects.all().delete()
        Student.objects.all().delete()

        # ── Students ──────────────────────────────────────────────────────────
        self.stdout.write('Seeding Students ...')

        students = [
            # Form 1
            Student(admission_no='2024/001', first_name='John',    last_name='Kamau',    date_of_birth=date(2010, 3, 15),  gender='male',   class_name='Form 1', stream='East',  admission_date=d(120), parent_name='Peter Kamau',    parent_phone='0712345601', parent_email='peter.kamau@email.com',   address='Nairobi',  status='active'),
            Student(admission_no='2024/002', first_name='Mary',    last_name='Wanjiku',  date_of_birth=date(2010, 7, 22),  gender='female', class_name='Form 1', stream='East',  admission_date=d(120), parent_name='Jane Wanjiku',   parent_phone='0712345602', parent_email='jane.wanjiku@email.com',  address='Kiambu',   status='active'),
            Student(admission_no='2024/003', first_name='Peter',   last_name='Njoroge',  date_of_birth=date(2010, 1, 10),  gender='male',   class_name='Form 1', stream='West',  admission_date=d(120), parent_name='James Njoroge',  parent_phone='0712345603', parent_email=None,                      address='Nakuru',   status='active'),
            Student(admission_no='2024/004', first_name='Grace',   last_name='Njoki',    date_of_birth=date(2010, 9, 5),   gender='female', class_name='Form 1', stream='West',  admission_date=d(120), parent_name='Ann Njoki',      parent_phone='0712345604', parent_email='ann.njoki@email.com',     address='Muranga',  status='active'),
            Student(admission_no='2024/005', first_name='Kevin',   last_name='Otieno',   date_of_birth=date(2010, 11, 28), gender='male',   class_name='Form 1', stream='North', admission_date=d(120), parent_name='Otieno Sr',      parent_phone='0712345605', parent_email=None,                      address='Kisumu',   status='active'),
            Student(admission_no='2024/006', first_name='Diana',   last_name='Achieng',  date_of_birth=date(2010, 6, 14),  gender='female', class_name='Form 1', stream='North', admission_date=d(120), parent_name='Rose Achieng',   parent_phone='0712345606', parent_email='rose.achieng@email.com',  address='Siaya',    status='active'),
            Student(admission_no='2024/007', first_name='Samuel',  last_name='Omondi',   date_of_birth=date(2010, 2, 19),  gender='male',   class_name='Form 1', stream='South', admission_date=d(120), parent_name='David Omondi',   parent_phone='0712345607', parent_email=None,                      address='Kisumu',   status='active'),
            Student(admission_no='2024/008', first_name='Fatuma',  last_name='Hassan',   date_of_birth=date(2010, 8, 3),   gender='female', class_name='Form 1', stream='South', admission_date=d(120), parent_name='Hassan Ali',     parent_phone='0712345608', parent_email='hassan.ali@email.com',    address='Mombasa',  status='inactive'),

            # Form 2
            Student(admission_no='2023/001', first_name='Brian',   last_name='Kariuki',  date_of_birth=date(2009, 4, 12),  gender='male',   class_name='Form 2', stream='East',  admission_date=d(480), parent_name='Joseph Kariuki', parent_phone='0712345609', parent_email='joseph.k@email.com',      address='Nairobi',  status='active'),
            Student(admission_no='2023/002', first_name='Alice',   last_name='Mwangi',   date_of_birth=date(2009, 10, 7),  gender='female', class_name='Form 2', stream='East',  admission_date=d(480), parent_name='Lucy Mwangi',    parent_phone='0712345610', parent_email='lucy.m@email.com',        address='Thika',    status='active'),
            Student(admission_no='2023/003', first_name='James',   last_name='Mugo',     date_of_birth=date(2009, 5, 25),  gender='male',   class_name='Form 2', stream='West',  admission_date=d(480), parent_name='Paul Mugo',      parent_phone='0712345611', parent_email=None,                      address='Murang\'a', status='active'),
            Student(admission_no='2023/004', first_name='Susan',   last_name='Kimani',   date_of_birth=date(2009, 12, 1),  gender='female', class_name='Form 2', stream='West',  admission_date=d(480), parent_name='Ruth Kimani',    parent_phone='0712345612', parent_email='ruth.k@email.com',        address='Nyeri',    status='active'),
            Student(admission_no='2023/005', first_name='Patrick', last_name='Odhiambo', date_of_birth=date(2009, 3, 18),  gender='male',   class_name='Form 2', stream='North', admission_date=d(480), parent_name='Odhiambo Sr',    parent_phone='0712345613', parent_email=None,                      address='Homa Bay', status='active'),
            Student(admission_no='2023/006', first_name='Esther',  last_name='Wambua',   date_of_birth=date(2009, 7, 30),  gender='female', class_name='Form 2', stream='North', admission_date=d(480), parent_name='Thomas Wambua',  parent_phone='0712345614', parent_email='t.wambua@email.com',      address='Machakos', status='active'),
            Student(admission_no='2023/007', first_name='Victor',  last_name='Njeru',    date_of_birth=date(2009, 9, 22),  gender='male',   class_name='Form 2', stream='South', admission_date=d(480), parent_name='George Njeru',   parent_phone='0712345615', parent_email=None,                      address='Embu',     status='transferred', notes='Transferred to Alliance High School'),
            Student(admission_no='2023/008', first_name='Lydia',   last_name='Chebet',   date_of_birth=date(2009, 1, 14),  gender='female', class_name='Form 2', stream='South', admission_date=d(480), parent_name='Chebet Sr',      parent_phone='0712345616', parent_email=None,                      address='Eldoret',  status='active'),

            # Form 3
            Student(admission_no='2022/001', first_name='Daniel',  last_name='Gitau',    date_of_birth=date(2008, 6, 8),   gender='male',   class_name='Form 3', stream='East',  admission_date=d(840), parent_name='Moses Gitau',    parent_phone='0712345617', parent_email='moses.g@email.com',       address='Nairobi',  status='active'),
            Student(admission_no='2022/002', first_name='Mercy',   last_name='Waweru',   date_of_birth=date(2008, 11, 19), gender='female', class_name='Form 3', stream='East',  admission_date=d(840), parent_name='Hannah Waweru',  parent_phone='0712345618', parent_email='hannah.w@email.com',      address='Kiambu',   status='active'),
            Student(admission_no='2022/003', first_name='Collins', last_name='Mutua',    date_of_birth=date(2008, 2, 27),  gender='male',   class_name='Form 3', stream='West',  admission_date=d(840), parent_name='Mutua Sr',       parent_phone='0712345619', parent_email=None,                      address='Kitui',    status='active'),
            Student(admission_no='2022/004', first_name='Joyce',   last_name='Ndung\'u', date_of_birth=date(2008, 8, 11),  gender='female', class_name='Form 3', stream='West',  admission_date=d(840), parent_name='Ndung\'u Sr',    parent_phone='0712345620', parent_email=None,                      address='Limuru',   status='active'),
            Student(admission_no='2022/005', first_name='Felix',   last_name='Oyugi',    date_of_birth=date(2008, 4, 3),   gender='male',   class_name='Form 3', stream='North', admission_date=d(840), parent_name='Oyugi Sr',       parent_phone='0712345621', parent_email='oyugi.sr@email.com',      address='Migori',   status='active'),
            Student(admission_no='2022/006', first_name='Caroline',last_name='Koech',    date_of_birth=date(2008, 10, 16), gender='female', class_name='Form 3', stream='North', admission_date=d(840), parent_name='Koech Sr',       parent_phone='0712345622', parent_email=None,                      address='Bomet',    status='active'),
            Student(admission_no='2022/007', first_name='Michael', last_name='Maina',    date_of_birth=date(2008, 12, 30), gender='male',   class_name='Form 3', stream='South', admission_date=d(840), parent_name='Maina Sr',       parent_phone='0712345623', parent_email='maina.sr@email.com',      address='Nyandarua', status='active'),
            Student(admission_no='2022/008', first_name='Winnie',  last_name='Adhiambo', date_of_birth=date(2008, 5, 21),  gender='female', class_name='Form 3', stream='South', admission_date=d(840), parent_name='Adhiambo Sr',    parent_phone='0712345624', parent_email=None,                      address='Kisumu',   status='transferred', notes='Transferred to Maseno School'),

            # Form 4
            Student(admission_no='2021/001', first_name='Robert',  last_name='Kamande',  date_of_birth=date(2007, 7, 15),  gender='male',   class_name='Form 4', stream='East',  admission_date=d(1200), parent_name='Kamande Sr',    parent_phone='0712345625', parent_email='kamande.sr@email.com',   address='Nairobi',  status='active'),
            Student(admission_no='2021/002', first_name='Faith',   last_name='Wangari',  date_of_birth=date(2007, 3, 28),  gender='female', class_name='Form 4', stream='East',  admission_date=d(1200), parent_name='Wangari Sr',    parent_phone='0712345626', parent_email=None,                     address='Karatina', status='active'),
            Student(admission_no='2021/003', first_name='Stephen', last_name='Musyoka',  date_of_birth=date(2007, 9, 4),   gender='male',   class_name='Form 4', stream='West',  admission_date=d(1200), parent_name='Musyoka Sr',    parent_phone='0712345627', parent_email='musyoka.sr@email.com',   address='Machakos', status='active'),
            Student(admission_no='2021/004', first_name='Sharon',  last_name='Awino',    date_of_birth=date(2007, 12, 17), gender='female', class_name='Form 4', stream='West',  admission_date=d(1200), parent_name='Awino Sr',      parent_phone='0712345628', parent_email=None,                     address='Kisumu',   status='active'),
            Student(admission_no='2021/005', first_name='Henry',   last_name='Kirui',    date_of_birth=date(2007, 1, 9),   gender='male',   class_name='Form 4', stream='North', admission_date=d(1200), parent_name='Kirui Sr',      parent_phone='0712345629', parent_email='kirui.sr@email.com',     address='Kericho',  status='active'),
            Student(admission_no='2021/006', first_name='Viola',   last_name='Nekesa',   date_of_birth=date(2007, 6, 23),  gender='female', class_name='Form 4', stream='North', admission_date=d(1200), parent_name='Nekesa Sr',     parent_phone='0712345630', parent_email=None,                     address='Bungoma',  status='active'),
            Student(admission_no='2021/007', first_name='Eric',    last_name='Ochieng',  date_of_birth=date(2007, 10, 12), gender='male',   class_name='Form 4', stream='South', admission_date=d(1200), parent_name='Ochieng Sr',    parent_phone='0712345631', parent_email='ochieng.sr@email.com',   address='Siaya',    status='active'),
            Student(admission_no='2021/008', first_name='Naomi',   last_name='Wainaina', date_of_birth=date(2007, 4, 6),   gender='female', class_name='Form 4', stream='South', admission_date=d(1200), parent_name='Wainaina Sr',   parent_phone='0712345632', parent_email=None,                     address='Nyeri',    status='active'),

            # Graduated (previous cohort)
            Student(admission_no='2020/001', first_name='David',   last_name='Njuguna',  date_of_birth=date(2006, 5, 14),  gender='male',   class_name='Form 4', stream='East',  admission_date=d(1560), parent_name='Njuguna Sr',   parent_phone='0712345633', parent_email=None,                     address='Nairobi',  status='graduated', notes='KCSE 2023 - A plain'),
            Student(admission_no='2020/002', first_name='Pauline', last_name='Muthoni',  date_of_birth=date(2006, 8, 20),  gender='female', class_name='Form 4', stream='West',  admission_date=d(1560), parent_name='Muthoni Sr',   parent_phone='0712345634', parent_email=None,                     address='Kiambu',   status='graduated', notes='KCSE 2023 - B+'),
            Student(admission_no='2020/003', first_name='George',  last_name='Wekesa',   date_of_birth=date(2006, 2, 11),  gender='male',   class_name='Form 4', stream='North', admission_date=d(1560), parent_name='Wekesa Sr',    parent_phone='0712345635', parent_email=None,                     address='Kakamega', status='graduated', notes='KCSE 2023 - A-'),
        ]
        for s in students:
            s.save()

        # ── Distributions ─────────────────────────────────────────────────────
        self.stdout.write('Seeding Distributions ...')

        distributions = [
            Distribution(date=d(90), class_name='Form 1', stream='East',  item_type='Textbook', item_name='Mathematics Form 1',         quantity_issued=32, students_count=32, issued_by='Mr. Mwangi',   received_by='Class Teacher Ouma',   status='Distributed'),
            Distribution(date=d(90), class_name='Form 1', stream='West',  item_type='Textbook', item_name='Mathematics Form 1',         quantity_issued=30, students_count=30, issued_by='Mr. Mwangi',   received_by='Class Teacher Njeri',  status='Distributed'),
            Distribution(date=d(88), class_name='Form 2', stream='East',  item_type='Textbook', item_name='English Language Form 2',    quantity_issued=35, students_count=35, issued_by='Ms. Auma',     received_by='Class Teacher Kamau',  status='Distributed'),
            Distribution(date=d(85), class_name='Form 2', stream='West',  item_type='Textbook', item_name='English Language Form 2',    quantity_issued=33, students_count=33, issued_by='Ms. Auma',     received_by='Class Teacher Weru',   status='Locked'),
            Distribution(date=d(60), class_name='Form 3', stream='East',  item_type='Textbook', item_name='Chemistry Form 3',           quantity_issued=28, students_count=28, issued_by='Mr. Odhiambo', received_by='Class Teacher Gitau',  status='Distributed'),
            Distribution(date=d(55), class_name='Form 3', stream='North', item_type='Textbook', item_name='Chemistry Form 3',           quantity_issued=30, students_count=30, issued_by='Mr. Odhiambo', received_by='Class Teacher Chebet', status='Distributed'),
            Distribution(date=d(30), class_name='Form 4', stream='East',  item_type='Textbook', item_name='Biology Form 4 (Revision)',  quantity_issued=25, students_count=25, issued_by='Mr. Kariuki',  received_by='Class Teacher Mwiti',  status='Distributed'),
            Distribution(date=d(28), class_name='Form 4', stream='West',  item_type='Textbook', item_name='Biology Form 4 (Revision)',  quantity_issued=27, students_count=27, issued_by='Mr. Kariuki',  received_by='Class Teacher Omolo',  status='Locked'),
            Distribution(date=d(14), class_name='Form 1', stream='North', item_type='Stationery', item_name='Exercise Books (Pack of 5)', quantity_issued=40, students_count=40, issued_by='Ms. Wanjiku', received_by='Class Teacher Mutiso', status='Distributed'),
            Distribution(date=d(7),  class_name='Form 2', stream='South', item_type='Uniform',  item_name='School Sweater',             quantity_issued=12, students_count=35, issued_by='Mr. Hassan',   received_by='Class Teacher Oloo',   status='Submitted'),
            Distribution(date=d(3),  class_name='Form 3', stream='West',  item_type='Stationery', item_name='Graph Books',              quantity_issued=30, students_count=30, issued_by='Ms. Auma',     received_by='Class Teacher Njiru',  status='Approved'),
            Distribution(date=d(1),  class_name='Form 4', stream='South', item_type='Textbook', item_name='KCSE Revision Kit',         quantity_issued=20, students_count=28, issued_by='Mr. Mwangi',   received_by='',                     status='Draft'),
        ]
        for dist in distributions:
            dist.save()

        # ── Not Collected ─────────────────────────────────────────────────────
        self.stdout.write('Seeding Not Collected ...')

        not_collected = [
            NotCollected(adm_no='2024/008', name='Fatuma Hassan',   class_name='Form 1 South', item='Mathematics Form 1',         reason='Absent on distribution day', days_overdue=85),
            NotCollected(adm_no='2023/007', name='Victor Njeru',    class_name='Form 2 South', item='English Language Form 2',    reason='Transferred before collection', days_overdue=80),
            NotCollected(adm_no='2021/005', name='Henry Kirui',     class_name='Form 4 North', item='Biology Form 4 (Revision)',  reason='Medical leave',              days_overdue=25),
            NotCollected(adm_no='2023/008', name='Lydia Chebet',    class_name='Form 2 South', item='School Sweater',             reason='Size not available',         days_overdue=7),
            NotCollected(adm_no='2022/008', name='Winnie Adhiambo', class_name='Form 3 South', item='Chemistry Form 3',           reason='Transferred to other school', days_overdue=50),
        ]
        NotCollected.objects.bulk_create(not_collected)  # no custom PK, bulk_create is fine

        # ── Replacements ──────────────────────────────────────────────────────
        self.stdout.write('Seeding Replacements ...')

        replacements = [
            Replacement(date=d(80), adm_no='2023/003', name='James Mugo',     class_name='Form 2 West',  item='English Language Form 2',  reason='Lost',    approved_by='Mr. Principal', status='Issued'),
            Replacement(date=d(75), adm_no='2022/001', name='Daniel Gitau',   class_name='Form 3 East',  item='Chemistry Form 3',         reason='Damaged', approved_by='Mr. Principal', status='Issued'),
            Replacement(date=d(60), adm_no='2024/003', name='Peter Njoroge',  class_name='Form 1 West',  item='Mathematics Form 1',       reason='Lost',    approved_by='Deputy Principal', status='Issued'),
            Replacement(date=d(45), adm_no='2021/003', name='Stephen Musyoka',class_name='Form 4 West',  item='Biology Form 4 (Revision)',reason='Damaged', approved_by='Mr. Principal', status='Issued'),
            Replacement(date=d(20), adm_no='2023/005', name='Patrick Odhiambo',class_name='Form 2 North',item='English Language Form 2',  reason='Lost',    approved_by='',              status='Pending'),
            Replacement(date=d(14), adm_no='2022/005', name='Felix Oyugi',    class_name='Form 3 North', item='Exercise Books (Pack of 5)',reason='Damaged', approved_by='',              status='Pending'),
            Replacement(date=d(7),  adm_no='2024/005', name='Kevin Otieno',   class_name='Form 1 North', item='Mathematics Form 1',       reason='Lost',    approved_by='',              status='Pending'),
            Replacement(date=d(2),  adm_no='2021/007', name='Eric Ochieng',   class_name='Form 4 South', item='KCSE Revision Kit',        reason='Damaged', approved_by='',              status='Rejected'),
        ]
        for r in replacements:
            r.save()

        total = Student.objects.count()
        active = Student.objects.filter(status='active').count()
        transferred = Student.objects.filter(status='transferred').count()
        graduated = Student.objects.filter(status='graduated').count()
        dists = Distribution.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f'\nStudents seeded successfully.\n'
            f'   {total} students | {active} active | {transferred} transferred | {graduated} graduated\n'
            f'   {dists} distributions | {NotCollected.objects.count()} not-collected | {Replacement.objects.count()} replacements'
        ))
