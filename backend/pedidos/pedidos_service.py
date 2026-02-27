from database.supabase_client import supabase
from datetime import datetime
from openpyxl import Workbook
from io import BytesIO

class PedidosService:
    
    ESTADOS = {
        "almacen": 0,
        "logistica": 1,
        "transportista": 2,
        "oficina": 3
    }

    def obtener_todos(self):
        response = supabase.table("pedidos").select("*").execute()
        return response.data

    def obtener_por_estado(self, estado):
        response = (
            supabase
            .table("pedidos")
            .select("*")
            .eq("estado", estado)
            .execute()
        )
        return response.data

    def obtener_por_rol(self, rol):
        if not rol:
            return []

        rol_norm = rol.strip().lower()

        if rol_norm == "admin":
            return self.obtener_todos()

        if rol_norm not in self.ESTADOS:
            return []

        estado_num = self.ESTADOS[rol_norm]
        return self.obtener_por_estado(estado_num)
    
    
    def crear(self, datos):
        """
        Crea un nuevo pedido.
        Siempre inicia en estado 'almacen' (0).
        """

        if not datos:
            return {"error": "Datos requeridos"}


        nuevo_pedido = {
            "cliente_nombre": datos["cliente_nombre"],
            "estado": datos.get("estado", 0),
            "usuario_responsable_id": datos["usuario_responsable_id"],
            "estado": self.ESTADOS["almacen"]  # Siempre empieza en almacen
        }

        response = (
            supabase
            .table("pedidos")
            .insert(nuevo_pedido)
            .execute()
        )

        return response.data
    

    def actualizar_estado(self, pedido_id, rol_usuario):
        # 1️⃣ Obtener pedido actual
        pedido = (
            supabase
            .table("pedidos")
            .select("*")
            .eq("id", pedido_id)
            .maybe_single()
            .execute()
        )
        
        rol_usuario = rol_usuario.strip().lower()

        if not pedido.data:
            return {"error": "Pedido no encontrado"}

        estado_actual = int(pedido.data["estado"])
        

        # 2️⃣ Validar que el rol coincide con el estado actual
        if rol_usuario not in self.ESTADOS:
            return {"error": "Rol no válido"}

        print("ROL DEL TOKEN:", rol_usuario)
        print("ESTADO ACTUAL BD:", estado_actual)
        print("ESTADO QUE DEBERÍA TENER ESE ROL:", self.ESTADOS.get(rol_usuario))
        if self.ESTADOS[rol_usuario] != estado_actual:
            return {"error": "No puedes modificar este pedido en su estado actual"}

        # 3️⃣ Calcular siguiente estado
        siguiente_estado = estado_actual + 1

        if siguiente_estado > 3:
            return {"error": "El pedido ya está finalizado"}

        # 4️⃣ Actualizar estado
        datos_actualizacion = {
            "estado": siguiente_estado
        }

        response = (
            supabase
            .table("pedidos")
            .update(datos_actualizacion)
            .eq("id", pedido_id)
            .execute()
        )

        return response.data
    
    def exportar_a_excel(self, pedido_id):
        response = supabase.table("pedido_productos").select("*").eq("pedido_id", pedido_id).execute()
        
        productos = response.data
        
        print("Productos obtenidos:", productos)
        
        wb = Workbook()
        ws = wb.active
        
        ws.append(["Código", "Nombre", "Cantidad"])
        
        for producto in productos:
            ws.append([
                producto['id'],
                producto['nombre_producto'],
                producto['cantidad']
            ])
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output
        