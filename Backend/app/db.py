import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
import socket

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


# Force IPv4 to avoid IPv6 connectivity issues on some hosting platforms (e.g., Render)
original_getaddrinfo = socket.getaddrinfo

def ipv4_only_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

def get_conn():
    # Temporarily force IPv4 for this connection
    socket.getaddrinfo = ipv4_only_getaddrinfo
    try:
        return psycopg.connect(DATABASE_URL, row_factory=dict_row)
    finally:
        socket.getaddrinfo = original_getaddrinfo