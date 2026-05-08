from app.db import get_conn
import json


def create_log(
    user_id=None,
    action_type="unknown",
    entity_type=None,
    entity_id=None,
    metadata=None,
):
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO usage_logs (
                        user_id,
                        action_type,
                        entity_type,
                        entity_id,
                        metadata_json
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (
                        user_id,
                        action_type,
                        entity_type,
                        entity_id,
                        json.dumps(metadata or {}),
                    ),
                )
                conn.commit()

    except Exception as e:
        print("Log error:", e)