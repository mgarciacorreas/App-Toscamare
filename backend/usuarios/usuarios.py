from flask import Blueprint, jsonify, request
from usuarios.usuarios_service import UsuariosService
from auth.jwt_handler import requiere_admin

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')
service = UsuariosService()

@usuarios_bp.route('', methods=['GET'])
@requiere_admin
def listar_usuarios():
    result = service.get_all_usuarios()
    if result['error']:
        return jsonify({"error": result['error']}), 500
    return jsonify({"usuarios": result['data']}), 200

@usuarios_bp.route('/<usuario_id>', methods=['GET'])
@requiere_admin
def obtener_usuario(usuario_id):
    result = service.get_usuario_by_id(usuario_id)
    if result['error']:
        return jsonify({"error": result['error']}), 500
    return jsonify({"usuario": result['data']}), 200

@usuarios_bp.route('', methods=['POST'])
@requiere_admin
def crear_usuario():
    data = request.json
    if not data or not data.get('email') or not data.get('nombre') or not data.get('rol'):
        return jsonify({"error": "Faltan campos: email, nombre, rol"}), 400
    
    result = service.create_usuario(
        data.get('email'),
        data.get('nombre'),
        data.get('rol')
    )
    if result['error']:
        return jsonify({"error": result['error']}), 400
    
    return jsonify({"usuario": result['data']}), 201

@usuarios_bp.route('/<usuario_id>', methods=['PUT'])
@requiere_admin
def update_usuario(usuario_id):
    data = request.json
    if not data :
        return jsonify({"error": "No hay datos para actualizar"}), 400
    
    result = service.update_usuario(
        usuario_id,
        data.get('email'),
        data.get('nombre'),
        data.get('rol')
    )
    
    if result['error']:
        return jsonify({"error": result['error']}), 400
    
    return jsonify({"usuario": result['data']}), 200

@usuarios_bp.route('/<usuario_id>', methods=['DELETE'])
@requiere_admin
def delete_usuario(usuario_id):
    result = service.delete_usuario(usuario_id)
    if result['error']:
        return jsonify({"error": result['error']}), 400
    return jsonify({"mensaje": "Usuario eliminado"}), 200