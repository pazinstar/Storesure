from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seed Item master and CapitalizationPolicy defaults'

    def handle(self, *args, **options):
        from roles.storekeeper.stores.models import Item, CapitalizationPolicy

        items = [
            {'code': 'ITM-CONS-001', 'name': 'Stationery - Pen', 'type': 'consumable', 'unit': 'pcs', 'base_unit_cost': 10},
            {'code': 'ITM-EXP-001', 'name': 'Expendable Container', 'type': 'expendable', 'unit': 'pcs', 'base_unit_cost': 200},
            {'code': 'ITM-PERM-001', 'name': 'Office Chair', 'type': 'permanent', 'unit': 'pcs', 'base_unit_cost': 3500},
            {'code': 'ITM-FA-001', 'name': 'Desktop Computer', 'type': 'fixed_asset', 'unit': 'pcs', 'base_unit_cost': 80000},
        ]

        for it in items:
            obj, created = Item.objects.update_or_create(code=it['code'], defaults={
                'name': it['name'], 'type': it['type'], 'unit': it.get('unit', ''), 'base_unit_cost': it.get('base_unit_cost', 0)
            })
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Item {obj.code}'))
            else:
                self.stdout.write(self.style.NOTICE(f'Updated Item {obj.code}'))

        policy, created = CapitalizationPolicy.objects.get_or_create(id=1, defaults={
            'currency': 'KES',
            'capitalization_threshold': 50000,
            'bulk_materiality_threshold': 100000,
            'min_useful_life_years': 2,
            'default_residual_value_pct': 0,
            'depreciation_start_rule': 'deployed',
        })
        if created:
            self.stdout.write(self.style.SUCCESS('Created default CapitalizationPolicy'))
        else:
            self.stdout.write(self.style.NOTICE('CapitalizationPolicy already exists'))
