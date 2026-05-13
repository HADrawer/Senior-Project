import os
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
from dotenv import load_dotenv
from threading import Lock

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_POOLER_URL") or os.getenv("DATABASE_URL")
FORCE_DB_IPV4 = os.getenv("FORCE_DB_IPV4", "").lower() in {"1", "true", "yes"}
DB_POOL_MIN_SIZE = int(os.getenv("DB_POOL_MIN_SIZE", "1"))
DB_POOL_MAX_SIZE = int(os.getenv("DB_POOL_MAX_SIZE", "5"))
DB_POOL_TIMEOUT_SECONDS = int(os.getenv("DB_POOL_TIMEOUT_SECONDS", "10"))

_pool = None
_pool_lock = Lock()


def get_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_POOLER_URL or DATABASE_URL is not configured")

    return _get_pool().connection()


def close_pool():
    global _pool

    if _pool:
        _pool.close()
        _pool = None


def _get_pool():
    global _pool

    if _pool:
        return _pool

    with _pool_lock:
        if _pool:
            return _pool

        _pool = ConnectionPool(
            conninfo=DATABASE_URL,
            kwargs=_connection_kwargs(),
            min_size=DB_POOL_MIN_SIZE,
            max_size=DB_POOL_MAX_SIZE,
            timeout=DB_POOL_TIMEOUT_SECONDS,
            open=False,
        )
        _pool.open()
        return _pool


def _connection_kwargs():
    kwargs = {
        "row_factory": dict_row,
        "prepare_threshold": None,
    }

    if FORCE_DB_IPV4:
        kwargs["hostaddr"] = _resolve_ipv4_hostaddr(DATABASE_URL)

    return kwargs


def _resolve_ipv4_hostaddr(database_url: str) -> str:
    import socket
    from urllib.parse import urlparse

    host = urlparse(database_url).hostname

    if not host:
        raise RuntimeError("DATABASE_URL is missing a database host")

    return socket.getaddrinfo(
        host,
        None,
        socket.AF_INET,
        socket.SOCK_STREAM,
    )[0][4][0]
