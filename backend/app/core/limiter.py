import os
from slowapi import Limiter
from slowapi.util import get_remote_address

IS_TESTING = os.getenv("TESTING") == "True"

limiter = Limiter(key_func=get_remote_address, enabled=not IS_TESTING)