from datetime import datetime, timedelta
from jose import jwt, JWTError

SECRET_KEY = "HARU"
ALGORITHM = "HS256"

ACCESS_EXPIRE_MIN = 15          # Access Token life
REFRESH_EXPIRE_DAYS = 7         # Refresh Token life


def create_access_token(payload: dict):
    data = payload.copy()
    data.update({"exp": datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE_MIN)})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(payload: dict):
    data = payload.copy()
    data.update({"exp": datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded
    except JWTError:
        return None
