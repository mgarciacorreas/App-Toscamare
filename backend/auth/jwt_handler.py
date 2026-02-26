from jose import jwt, JWTError
from datetime import datetime, timedelta
from config import Config
from functools import wraps
from flask import jsonify, request

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
    
def requiere_admin(funcion):
    @wraps(funcion)
    def wrapper(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        try:
            auth_token = token.split(' ')[1]
        except:
            return jsonify({"error": "Formato de token no válido"}), 401
        
        if not auth_token:
            return jsonify({"error": "Token no proporcionado"}), 401
        
        payload = verificar_jwt(auth_token)
        
        if not payload:
            return jsonify({"error": "Token inválido"}), 401
        
        if payload['rol'] == 'admin':
            return funcion(*args, **kwargs)
        else:
            return jsonify({"error": "No tienes permisos"}), 403
    
    return wrapper
        
        
        
        