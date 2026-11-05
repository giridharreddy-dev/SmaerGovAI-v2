import os
import unittest
from uuid import uuid4

from services.firestore_repository import merge_scheme_patch, safe_update_scheme


class SchemePatchTests(unittest.TestCase):
    def test_preserves_map_entries_and_fields_with_partial_patch(self):
        existing = {"required_documents": [{"name": "ID", "optional": False}], "eligibility": {"income": 300, "state": "AP"}}
        patch = {"required_documents": [{"optional": False, "name": "ID"}, {"name": "Referral"}], "eligibility": {"income": 0}}
        self.assertEqual(merge_scheme_patch(existing, patch), {
            "required_documents": [{"name": "ID", "optional": False}, {"name": "Referral"}],
            "eligibility": {"income": 0, "state": "AP"},
        })
        self.assertEqual(merge_scheme_patch(existing, {"required_documents": []}), existing)
        with self.assertRaises(ValueError):
            merge_scheme_patch(existing, {"required_documents": None})

    @unittest.skipUnless(os.environ.get("FIRESTORE_EMULATOR_HOST"), "requires Firestore emulator")
    def test_iam_repository_transaction_preserves_checklist(self):
        from google.cloud.firestore import Client

        client = Client(project="demo-smartgov")
        scheme_id = "python-test-" + uuid4().hex
        safe_update_scheme(client, scheme_id, {"required_documents": [{"name": "Original ID"}], "benefits": {"cashless": True}})
        safe_update_scheme(client, scheme_id, {"required_documents": [{"name": "Referral"}], "benefits": {"amount": 0}})
        safe_update_scheme(client, scheme_id, {"required_documents": []})
        self.assertEqual(client.collection("schemes").document(scheme_id).get().to_dict(), {
            "required_documents": [{"name": "Original ID"}, {"name": "Referral"}],
            "benefits": {"amount": 0, "cashless": True},
        })
        client.close()
