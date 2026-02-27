from flask import Blueprint, jsonify, request, send_file
from auth.jwt_handler import verificar_jwt
from .pedidos_service import PedidosService


pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')
service = PedidosService()

@pedidos_bp.route('', methods=['GET'])
def obtener_pedidos():
    """Obtiene pedidos según el rol del usuario"""

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Token requerido"}), 401

    try:
        token = auth_header.split(" ")[1]
    except IndexError:
        return jsonify({"error": "Formato de token inválido"}), 401

    payload = verificar_jwt(token)

    if not payload:
        return jsonify({"error": "Token inválido"}), 401

    rol_usuario = payload.get("rol")

    if not rol_usuario:
        return jsonify({"error": "Rol no encontrado en el token"}), 403

    pedidos = service.obtener_por_rol(rol_usuario)

    return jsonify(pedidos), 200

@pedidos_bp.route('/<int:id>', methods=['GET'])
def obtener_pedido(id):
    """Obtiene un pedido por ID"""
    return jsonify(service.obtener_por_id(id))

@pedidos_bp.route('', methods=['POST'])
def crear_pedido():
    """Crea un nuevo pedido"""

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Token requerido"}), 401

    try:
        token = auth_header.split(" ")[1]
    except IndexError:
        return jsonify({"error": "Formato de token inválido"}), 401

    payload = verificar_jwt(token)

    if not payload:
        return jsonify({"error": "Token inválido"}), 401

    # Opcional: solo oficina puede crear pedidos
    if payload.get("rol") != "oficina":
        return jsonify({"error": "No autorizado"}), 403

    datos = request.get_json()

    pedido = service.crear(datos)

    return jsonify(pedido), 201




# Función que actualiza el estado del pedido 
@pedidos_bp.route('/<uuid:id>/estado', methods=['PATCH'])
def actualizar_estado_pedido(id):

    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return jsonify({"error": "Token requerido"}), 401

    try:
        token = auth_header.split(" ")[1]
    except IndexError:
        return jsonify({"error": "Formato de token inválido"}), 401

    payload = verificar_jwt(token)

    if not payload:
        return jsonify({"error": "Token inválido"}), 401

    rol_usuario = payload.get("rol")

    resultado = service.actualizar_estado(str(id), rol_usuario)

    if "error" in resultado:
        return jsonify(resultado), 400

    return jsonify(resultado), 200

@pedidos_bp.route('/<uuid:id>/export/excel', methods=['GET'])
def exportar_pedido_excel(id):
    archivo_excel = service.exportar_a_excel(str(id))
    
    return send_file(
        archivo_excel,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=f'pedido_{id}.xlsx'
    )