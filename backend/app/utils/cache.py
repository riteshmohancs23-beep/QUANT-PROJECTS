import functools
import pandas as pd
from datetime import datetime, timedelta

# Simple in-memory cache
class DataCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, key):
        if key in self._cache:
            entry = self._cache[key]
            # Simple TTL of 1 hour
            if datetime.now() - entry['time'] < timedelta(hours=1):
                return entry['data']
            else:
                del self._cache[key]
        return None

    def set(self, key, data: pd.DataFrame):
        self._cache[key] = {
            'time': datetime.now(),
            'data': data.copy(deep=True) if isinstance(data, pd.DataFrame) else data
        }

# Global cache instance
df_cache = DataCache()
