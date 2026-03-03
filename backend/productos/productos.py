from flask import request, jsonify, Blueprint
from database.supabase_client_admin import supabase_admin
from auth.jwt_handler import requiere_autenticacion, requiere_rol
from utils.error_handler import respuesta_error
from utils.validators import validar_cantidad

productos_bp = Blueprint('productos', __name__)


# --- RUTAS DE LA API ---
# La autenticación y autorización se manejan con decoradores Flask.
# Usamos supabase_admin (service_role) para bypass RLS, ya que los permisos
# se validan en la capa de rutas, no en Supabase.


# 1. Listar productos de un pedido (GET)
@productos_bp.route("/api/pedidos/<pedido_id>/productos", methods=['GET'])
@requiere_autenticacion
def listar_productos(pedido_id):
    try:
        response = supabase_admin.table("pedido_productos").select("*").eq("pedido_id", pedido_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return respuesta_error(str(e), 500)


# 2. Añadir un producto a un pedido (POST)
@productos_bp.route('/api/pedido-productos', methods=['POST'])
@requiere_rol(["oficina", "almacen", "logistica"])
def añadir_producto():
    try:
        datos = request.json

        if not validar_cantidad(datos['cantidad']):
            return respuesta_error("Cantidad inválida. Debe ser mayor que 0", 400)

        nueva_fila = {
            "pedido_id": datos['pedido_id'],
            "nombre_producto": datos['nombre_producto'],
            "cantidad": datos['cantidad']
        }
        response = supabase_admin.table("pedido_productos").insert(nueva_fila).execute()
        return jsonify(response.data), 201
    except Exception as e:
        return respuesta_error(str(e), 400)


# 3. Actualizar un producto de un pedido (PUT)
@productos_bp.route('/api/pedido-productos/<producto_id>', methods=['PUT'])
@requiere_rol(["oficina", "logistica"])
def actualizar_producto(producto_id):
    try:
        datos = request.json

        if datos.get("cantidad") and not validar_cantidad(datos.get("cantidad")):
            return respuesta_error("Cantidad inválida. Debe ser mayor que 0", 400)

        response = supabase_admin.table("pedido_productos").update({
            "nombre_producto": datos.get("nombre_producto"),
            "cantidad": datos.get("cantidad")
        }).eq("id", producto_id).execute()

        return jsonify(response.data), 200
    except Exception as e:
        return respuesta_error(str(e), 400)


# 4. Eliminar un producto de un pedido (DELETE)
@productos_bp.route('/api/pedido-productos/<producto_id>', methods=['DELETE'])
@requiere_rol(["oficina", "almacen", "logistica"])
def eliminar_producto(producto_id):
    try:
        response = supabase_admin.table("pedido_productos").delete().eq("id", producto_id).execute()

        if not response.data:
            return respuesta_error("Producto no encontrado o ya eliminado", 404)

        return jsonify({"message": "Producto eliminado correctamente"}), 200
    except Exception as e:
        return respuesta_error(str(e), 400)
