from app.db import get_conn
import json


def create_log(
    user_id=None,
    action_type="unknown",
    entity_type=None,
    entity_id=None,
    metadata=None,
    conn=None,
):
    def insert_log(target_conn):
        with target_conn.cursor() as cur:
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

    try:
        if conn:
            with conn.transaction():
                insert_log(conn)
            return

        with get_conn() as log_conn:
            insert_log(log_conn)
            log_conn.commit()

    except Exception as e:
        print("Log error:", e)
