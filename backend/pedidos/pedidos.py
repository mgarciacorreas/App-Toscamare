from flask import Blueprint, jsonify, request
from backend.pedidos.pedidos_service import PedidosService


pedidos_bp = Blueprint('pedidos', __name__, url_prefix='/api/pedidos')
service = PedidosService()

@pedidos_bp.route('', methods=['GET'])
def obtener_pedidos():
    """Obtiene todos los pedidos"""
    return jsonify(service.obtener_todos())

@pedidos_bp.route('/<int:id>', methods=['GET'])
def obtener_pedido(id):
    """Obtiene un pedido por ID"""
    return jsonify(service.obtener_por_id(id))

@pedidos_bp.route('', methods=['POST'])
def crear_pedido():
    """Crea un nuevo pedido"""
    return jsonify(service.crear(request.json))

@pedidos_bp.route('/<int:id>', methods=['PATCH'])
def actualizar_estado_pedido(id):
    """Actualiza el estado de un pedido"""
    datos = request.get_json()
    estado_actual = datos.get('estado_actual')
    
    if not estado_actual:
        return jsonify({"error": "estado_actual es requerido"}), 400
    
    return jsonify(service.actualizar_estado(id, estado_actual))