from backend.config.database import supabase

class PedidosService:

    def obtener_todos(self):
        response = supabase.table("pedidos").select("*").execute()
        return response.data
    