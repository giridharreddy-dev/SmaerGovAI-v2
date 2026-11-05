"""Guarded IAM Firestore writes for the opt-in Python catalog importer."""

import re
from copy import deepcopy
from datetime import datetime, timezone


def merge_scheme_patch(existing, patch):
    merged = dict(existing)
    for key, value in patch.items():
        prior = merged.get(key)
        if key == "required_documents":
            if not isinstance(value, list):
                raise ValueError("required_documents must be a list")
            if prior is not None and not isinstance(prior, list):
                raise ValueError("Repair the existing malformed required_documents before importing")
            documents = deepcopy(prior or [])
            for item in value:
                if item not in documents:
                    documents.append(deepcopy(item))
            merged[key] = documents
        elif value is None or isinstance(value, str) and not value.strip():
            continue
        elif isinstance(prior, dict) and not isinstance(value, dict):
            continue
        elif isinstance(prior, list) and not isinstance(value, list):
            continue
        elif isinstance(value, dict):
            merged[key] = merge_scheme_patch(prior if isinstance(prior, dict) else {}, value)
        elif not isinstance(value, list) or value or prior is None:
            merged[key] = value
    return merged


def safe_update_scheme(db_client, scheme_id, patch):
    from google.cloud.firestore import transactional

    reference = db_client.collection("schemes").document(scheme_id)

    @transactional
    def update(transaction):
        snapshot = reference.get(transaction=transaction)
        existing = snapshot.to_dict() if snapshot.exists else {}
        transaction.set(reference, merge_scheme_patch(existing, patch), merge=True)

    update(db_client.transaction())


def sync_catalog(config, schemes):
    from google.cloud.firestore import Client

    project, database = config["projectId"], config["firestoreDatabaseId"]
    # Preflight every slug before the first transaction, so collisions cannot merge unrelated records.
    records = {}
    for name, record in schemes.items():
        scheme_id = re.sub(r"[^a-z0-9]+", "-", name.lower())[:48].strip("-")
        if not scheme_id or scheme_id in records:
            raise ValueError(f"Missing or duplicate Firestore ID for {name}")
        records[scheme_id] = (name, record)

    client = Client(project=project, database=database)
    for scheme_id, (name, record) in records.items():
        patch = {key: record[key] for key in (
            "telugu_name", "level", "category", "benefit_amount", "benefit_amount_te",
            "source_name", "source_url", "simplified", "telugu", "required_documents",
            "eligibility_questions", "key_treatments", "key_treatments_te",
        ) if key in record}
        patch.update(id=scheme_id, scheme_name=name, updated_at=datetime.now(timezone.utc).isoformat())
        safe_update_scheme(client, scheme_id, patch)
    return len(records)
