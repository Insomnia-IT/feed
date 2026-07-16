from datetime import datetime, timezone

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class ObservabilityMigrationTests(TransactionTestCase):
    def test_upgrade_from_pre_observability_preserves_sync_and_ulid_data(self):
        executor = MigrationExecutor(connection)
        old_targets = [("feeder", "0079_add_groupbadge_is_disabled"), ("synchronization", "0005_synchronizationsystemactions_sync_sys_dir_date_idx_and_more")]
        executor.migrate(old_targets)
        old_apps = executor.loader.project_state(old_targets).apps
        Kitchen = old_apps.get_model("feeder", "Kitchen")
        FeedTransaction = old_apps.get_model("feeder", "FeedTransaction")
        Sync = old_apps.get_model("synchronization", "SynchronizationSystemActions")
        kitchen = Kitchen.objects.create(name="Migration synthetic", pin_code="migration-pin")
        ulid = "01MIGRATIONPRESERVESULID00001"
        FeedTransaction.objects.create(
            ulid=ulid, kitchen_id=kitchen.id, amount=1, dtime=datetime.now(timezone.utc),
            meal_time="lunch", is_vegan=False, is_paid=False, is_anomaly=False,
        )
        sync_id = Sync.objects.create(
            system="notion", direction="from_system", date=datetime.now(timezone.utc), success=True
        ).id

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        from feeder.client_diagnostics import ClientDiagnosticEvent
        from feeder.models import FeedTransaction as CurrentFeedTransaction
        from synchronization.models import SynchronizationSystemActions

        self.assertTrue(CurrentFeedTransaction.objects.filter(ulid=ulid).exists())
        migrated_sync = SynchronizationSystemActions.objects.get(id=sync_id)
        self.assertTrue(migrated_sync.success)
        self.assertIsNotNone(migrated_sync.sync_run_id)

        ClientDiagnosticEvent.objects.bulk_create([
            ClientDiagnosticEvent(
                event_id=f"01MIGRATIONEVENT{i:016d}", installation_hash="0" * 64,
                kitchen_id=kitchen.id, event_type="heartbeat", occurred_at=datetime.now(timezone.utc),
                app_version="test", state="ok", details={},
            ) for i in range(2000)
        ])
        self.assertEqual(ClientDiagnosticEvent.objects.count(), 2000)

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        self.assertTrue(CurrentFeedTransaction.objects.filter(ulid=ulid).exists())
        self.assertEqual(ClientDiagnosticEvent.objects.count(), 2000)
