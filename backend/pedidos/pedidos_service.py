from database.supabase_client import supabase

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
        if rol not in self.ESTADOS:
            return []

        estado_num = self.ESTADOS[rol]
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