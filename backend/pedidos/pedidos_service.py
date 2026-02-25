from database.supabase_client.py import supabase

class PedidosService:

    def obtener_todos(self):
        response = supabase.table("pedidos").select("*").execute()
        return response.data
    