import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
FORCE_DB_IPV4 = os.getenv("FORCE_DB_IPV4", "").lower() in {"1", "true", "yes"}


def get_conn():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured")

    kwargs = {"row_factory": dict_row}

    if FORCE_DB_IPV4:
        kwargs["hostaddr"] = _resolve_ipv4_hostaddr(DATABASE_URL)

    return psycopg.connect(DATABASE_URL, **kwargs)


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
