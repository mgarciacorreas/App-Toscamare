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