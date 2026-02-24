from jose import jwt, JWTError
from datetime import datetime, timedelta
from config import Config

def generar_jwt(user_data):
    """
    Genera un JWT con los datos del usuario
    """
    expiration = datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    
    payload = {
        'user_id': user_data['id'],
        'email': user_data['email'],
        'nombre': user_data['nombre'],
        'rol': user_data['rol'],
        'exp': expiration
    }
    
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)
    return token


def verificar_jwt(token):
    """Verifica si un JWT es válido y devuelve los datos"""
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=[Config.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None