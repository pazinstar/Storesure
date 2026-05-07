from django.core.management.base import BaseCommand
from django.utils import timezone
from ...models import BulkCreationJob, CapitalizationPrompt, FixedAsset
from ...serializers import FixedAssetCreateSerializer

class Command(BaseCommand):
    help = 'Process queued bulk child creation jobs'

    def handle(self, *args, **options):
        jobs = BulkCreationJob.objects.filter(status='queued').order_by('createdAt')[:10]
        for job in jobs:
            self.stdout.write(f"Processing job {job.id} for {job.bulk_group_ref}")
            job.status = 'processing'
            job.attempts += 1
            job.save()
            try:
                prompts = CapitalizationPrompt.objects.filter(bulk_group_ref=job.bulk_group_ref)
                total_qty = sum([p.quantity for p in prompts])
                master = FixedAsset.objects.filter(source_prompt__bulk_group_ref=job.bulk_group_ref).first()
                if not master:
                    self.stdout.write(f"No master asset found for {job.bulk_group_ref}, creating skipped")
                tag_prefix = job.options.get('child_tag_prefix', '')
                approved_by = job.options.get('approved_by', job.created_by)
                tag_counter = 1
                created = 0
                for p in prompts:
                    for i in range(p.quantity):
                        child_payload = {
                            'name': p.item_name or (p.item.name if p.item else f'Child of {job.bulk_group_ref}'),
                            'qty': 1,
                            'unit_cost': p.unit_cost,
                            'total_cost': p.unit_cost,
                            'category_type': p.suggested_category_type or p.category_type or 'fixed_asset',
                            'parent_asset': master.id if master else None,
                            'source_item': p.item.id if p.item else None,
                            'source_prompt': p.id,
                            'created_by': approved_by,
                        }
                        if tag_prefix:
                            child_payload['tag_no'] = f"{tag_prefix}-{tag_counter:06d}"
                        child_serializer = FixedAssetCreateSerializer(data=child_payload)
                        if child_serializer.is_valid():
                            child_serializer.save()
                            created += 1
                        else:
                            self.stdout.write(str(child_serializer.errors))
                        tag_counter += 1

                job.status = 'done'
                job.save()
                self.stdout.write(f"Job {job.id} completed, created {created} child assets")
            except Exception as e:
                job.status = 'failed'
                job.last_error = str(e)
                job.save()
                self.stderr.write(f"Job {job.id} failed: {e}")
