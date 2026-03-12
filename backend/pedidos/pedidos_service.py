from database.supabase_client_admin import supabase_admin
from datetime import datetime
import os
import uuid
import tempfile
import shutil
import base64
import time
import threading
from pathlib import Path

# OCR imports (usa el paquete local `ocr/src`)
from ocr.src.pdf_to_img import convert_pdf_to_images
from ocr.src.ocr import ocr_image_text_and_data
from ocr.src.extract import extract_albaran_data
from openpyxl import Workbook
from pypdf import PdfReader, PdfWriter
from io import BytesIO
import fitz
class PedidosService:
    
    ESTADOS = {
        "almacen": 0,
        "logistica": 1,
        "transportista": 2,
        "oficina": 3
    }
    
    # Guardar PDFs en este bucket de Supabase Storage
    BUCKET = "pedidos-pdfs"
    
    # ===============================================
    # OBTENER
    # ===============================================
    
    
    # Métodos para obtener pedidos (usa supabase_admin para bypass RLS)
    def obtener_todos(self):
        response = supabase_admin.table("pedidos").select("*").execute()
        return response.data

    # Obtener pedidos por estado (almacen, logistica, transportista, oficina)
    def obtener_por_estado(self, estado):
        response = (
            supabase_admin
            .table("pedidos")
            .select("*")
            .eq("estado", estado)
            .execute()
        )
        return response.data

    # Obtener pedidos por rol (almacen, logistica, transportista, oficina)
    def obtener_por_rol(self, rol):
        if not rol:
            return []

        rol_norm = rol.strip().lower()

        if rol_norm in ("admin", "oficina"):
            return self.obtener_todos()

        if rol_norm not in self.ESTADOS:
            return []

        estado_num = self.ESTADOS[rol_norm]
        return self.obtener_por_estado(estado_num)

    def obtener_por_id(self, pedido_id):
        """
        Obtiene un pedido por su ID y adjunta los productos relacionados.
        Usa el cliente admin para asegurar que se recuperan los productos
        independientemente de las políticas RLS (la ruta que llama a este
        método ya está protegida por autenticación).
        """
        pedido = (
            supabase_admin
            .table("pedidos")
            .select("*")
            .eq("id", pedido_id)
            .maybe_single()
            .execute()
        )

        if not pedido.data:
            return None

        # Obtener productos asociados usando el cliente admin para evitar RLS
        try:
            productos_resp = (
                supabase_admin
                .table("pedido_productos")
                .select("*")
                .eq("pedido_id", pedido_id)
                .execute()
            )
            productos = productos_resp.data or []
        except Exception:
            productos = []

        resultado = pedido.data
        resultado["productos"] = productos
        return resultado
    
    # ===============================================
    # CREAR Y SUBIR PDF
    # ===============================================
    
    # def crear(self, datos):
    #     """
    #     Crea un nuevo pedido.
    #     Siempre inicia en estado 'almacen' (0).
    #     """

    #     if not datos:
    #         return {"error": "Datos requeridos"}


    #     nuevo_pedido = {
    #         "cliente_nombre": datos["cliente_nombre"],
    #         "estado": datos.get("estado", 0),
    #         "usuario_responsable_id": datos["usuario_responsable_id"],
    #         "estado": self.ESTADOS["almacen"]  # Siempre empieza en almacen
    #     }

    #     response = (
    #         supabase
    #         .table("pedidos")
    #         .insert(nuevo_pedido)
    #         .execute()
    #     )

    #     return response.data
    
    
    # Crear un nuevo pedido con PDF. Extrae datos automáticamente del PDF con OCR.
    def crear_con_pdf(self, cliente_nombre, usuario_responsable_id, archivo_pdf):
        pedido_id = str(uuid.uuid4())
        nombre_archivo = f"{pedido_id}.pdf"

        print(f"[CREATE_PEDIDO] Iniciando creación. ID: {pedido_id}, Cliente: {cliente_nombre}")

       # 1. Crear temporal para el PDF
        tmp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp_pdf_path = tmp_pdf.name
        tmp_pdf.close()
        
        try:
            archivo_pdf.save(tmp_pdf_path)
            
            # RECTIFICAR ORIENTACIÓN
            try:
                modificado = False
                writer = PdfWriter()
                
                # Usar "with open" asegura que Python suelte el archivo al terminar de leer
                with open(tmp_pdf_path, 'rb') as f_in:
                    reader = PdfReader(f_in)
                    for page in reader.pages:
                        w, h = float(page.mediabox.width), float(page.mediabox.height)
                        if w > h:
                            page.rotate(270)
                            modificado = True
                        writer.add_page(page)
                
                # Solo sobreescribir una vez que el bloque anterior (f_in) ya se cerró
                if modificado:
                    with open(tmp_pdf_path, 'wb') as f_out:
                        writer.write(f_out)
                    print("[CREATE_PEDIDO] PDF rotado a formato vertical.")
            except Exception as e:
                print(f"[CREATE_PEDIDO][ERROR] Ignorado error al rotar: {e}")

            # 2. Subir a Supabase Storage
            with open(tmp_pdf_path, 'rb') as f:
                supabase_admin.storage.from_(self.BUCKET).upload(
                    nombre_archivo,
                    f.read(),
                    {"content-type": "application/pdf"}
                )
        except Exception as e:
            print(f"[CREATE_PEDIDO][ERROR] Error al guardar/subir PDF: {e}")
            return {"error": f"Error al guardar PDF: {e}"}

        # 3. Crear pedido en BD
        nuevo_pedido = {
            "id": pedido_id,
            "cliente_nombre": cliente_nombre,
            "estado": self.ESTADOS["almacen"],
            "usuario_responsable_id": usuario_responsable_id,
            "pdf_url": nombre_archivo
        }

        try:
            response = supabase_admin.table("pedidos").insert(nuevo_pedido).execute()
        except Exception as e:
            print(f"[CREATE_PEDIDO][ERROR] Error al crear pedido en BD: {e}")
            return {"error": f"Error al crear pedido en BD: {e}"}

        # 4. Procesamiento OCR
        try:
            print(f"[OCR] Iniciando OCR para {pedido_id}")
            
            # Uso de TemporaryDirectory para limpieza automática
            with tempfile.TemporaryDirectory() as tmp_images_dir_str:
                tmp_images_dir = Path(tmp_images_dir_str)
                
                try:
                    image_files = convert_pdf_to_images(tmp_pdf_path, tmp_images_dir)
                except Exception as e:
                    print(f"[OCR][ERROR] Error al convertir PDF: {e}")
                    image_files = []

                all_text = ""
                ocr_data_list = []
                
                for img in image_files:
                    try:
                        t, data = ocr_image_text_and_data(img, lang='spa+por')
                        all_text += t + "\n"
                        if data:
                            ocr_data_list.append(data)
                    except Exception as e:
                        print(f"[OCR][ERROR] Error en ocr_image_text_and_data: {e}")

                # Extraer productos
                try:
                    albaran_data = extract_albaran_data(all_text, ocr_data_list=ocr_data_list)
                    productos = albaran_data.get('productos', [])
                except Exception as e:
                    print(f"[OCR][ERROR] Error extrayendo productos: {e}")
                    productos = []

                # OPTIMIZACIÓN: Inserción masiva (Bulk Insert) de productos
                if productos:
                    filas_a_insertar = []
                    for producto in productos:
                        filas_a_insertar.append({
                            'pedido_id': pedido_id,
                            'nombre_producto': producto.get('especie') or producto.get('linea_original'),
                            'cantidad': producto.get('peso_kg') or 0,
                            'precio': producto.get('precio') or 0
                        })
                    
                    try:
                        # Una sola llamada a la API de Supabase en lugar de un bucle
                        supabase_admin.table('pedido_productos').insert(filas_a_insertar).execute()
                        print(f"[OCR] {len(filas_a_insertar)} productos insertados correctamente.")
                    except Exception as e:
                        print(f"[OCR][ERROR] Error en inserción masiva: {e}")
                else:
                    print(f"[OCR] WARNING: No se extrajeron productos")

        except Exception as e:
            print(f"[OCR][WARNING] Error general en proceso OCR: {e}")
            
        finally:
            # Solo necesitamos limpiar el PDF manualmente, TemporaryDirectory limpia las imágenes
            if Path(tmp_pdf_path).exists():
                Path(tmp_pdf_path).unlink(missing_ok=True)

        return response.data
    
    # =========================
    # OBTENER URL FIRMADA
    # =========================

    def obtener_pdf_firmado(self, pedido_id):

        pedido = (
            supabase_admin
            .table("pedidos")
            .select("pdf_url, pdf_firmado")
            .eq("id", pedido_id)
            .maybe_single()
            .execute()
        )

        if not pedido.data:
            return {"error": "Pedido no encontrado"}

        nombre_archivo = pedido.data.get("pdf_firmado") or pedido.data.get("pdf_url")

        if not nombre_archivo:
            return {"error": "Este pedido no tiene PDF"}

        # Generar URL firmada (60 segundos)
        signed_url = supabase_admin.storage.from_(self.BUCKET).create_signed_url(
            nombre_archivo,
            60
        )

        return signed_url
    
    def obtener_pdf_preview(self, pedido_id):
        pedido = (
            supabase_admin
            .table("pedidos")
            .select("pdf_url")
            .eq("id", pedido_id)
            .maybe_single()
            .execute()
        )

        if not pedido.data or not pedido.data.get("pdf_url"):
            return {"error": "Este pedido no tiene PDF"}

        try:
            pdf_bytes = supabase_admin.storage.from_(self.BUCKET).download(pedido.data["pdf_url"])
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if len(doc) == 0:
                return {"error": "PDF vacío"}
                
            page = doc[0]
            # Si es apaisado, lo mostramos derecho para que coincida con lo que procesa la firma
            if page.rect.width > page.rect.height:
                page.set_rotation(page.rotation + 270)
                
            # Render a imagen (DPI ~150 para que no sea inmensa ni se vea mal)
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)
            return pix.tobytes("png")
        except Exception as e:
            print(f"[PREVIEW][ERROR] Error generando preview: {e}")
            return {"error": "Error procesando el PDF para preview"}
    

    
    # Función que actualiza el estado del pedido, solo si el rol del usuario coincide con el estado actual del pedido
    def actualizar_estado(self, pedido_id, rol_usuario):
        # Obtener pedido actual
        pedido = (
            supabase_admin
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

        # Admin y oficina pueden avanzar cualquier estado
        if rol_usuario not in ("admin", "oficina"):
            if rol_usuario not in self.ESTADOS:
                return {"error": "Rol no válido"}
            if self.ESTADOS[rol_usuario] != estado_actual:
                return {"error": "No puedes modificar este pedido en su estado actual"}

        # Calcular siguiente estado
        siguiente_estado = estado_actual + 1

        if siguiente_estado > 4:
            return {"error": "El pedido ya está finalizado"}

        # Actualizar estado
        response = (
            supabase_admin
            .table("pedidos")
            .update({"estado": siguiente_estado})
            .eq("id", pedido_id)
            .execute()
        )

        return response.data

    # Retroceder estado: devolver pedido al rol anterior para correcciones
    def retroceder_estado(self, pedido_id, rol_usuario):
        pedido = (
            supabase_admin
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

        if estado_actual <= 0:
            return {"error": "El pedido ya está en el primer estado"}

        # Ni la oficina ni el administrador pueden devolver pedidos que ya han sido completados por el transportista (estado 3)
        if estado_actual == 3 and rol_usuario in ("admin", "oficina"):
            return {"error": "No se puede devolver un pedido que ya ha sido firmado y confirmado por el transportista"}

        # Admin y oficina pueden retroceder cualquier estado (salvo restricción anterior)
        # Los demás roles solo pueden retroceder su propio estado
        if rol_usuario not in ("admin", "oficina"):
            if rol_usuario not in self.ESTADOS:
                return {"error": "Rol no válido"}
            if self.ESTADOS[rol_usuario] != estado_actual:
                return {"error": "No puedes retroceder este pedido en su estado actual"}

        estado_anterior = estado_actual - 1

        update_data = {"estado": estado_anterior}
        
        # Si el pedido está en manos del transportista (estado 2) y se devuelve a logística (1),
        # quitamos la firma porque el proceso de carga se está invalidando o corrigiendo.
        # Si ya está en oficina (estado 3) y se devuelve, mantenemos la firma 'por si acaso' 
        # (p.ej. corrección administrativa pero la firma de entrega sigue siendo válida).
        if estado_actual == 2:
            update_data["pdf_firmado"] = None

        response = (
            supabase_admin
            .table("pedidos")
            .update(update_data)
            .eq("id", pedido_id)
            .execute()
        )

        return response.data

    # Eliminar pedido (solo admin/oficina)
    def eliminar_pedido(self, pedido_id):
        # Primero eliminar productos asociados
        supabase_admin.table("pedido_productos").delete().eq("pedido_id", pedido_id).execute()

        # Luego eliminar el pedido
        response = (
            supabase_admin
            .table("pedidos")
            .delete()
            .eq("id", pedido_id)
            .execute()
        )

        return response.data
    
    # =========================
    # FIRMAR PEDIDO (incrustar firma en PDF)
    # =========================

    def firmar_pedido(self, pedido_id, firma_base64):
        """
        Recibe la firma del cliente como imagen base64,
        la incrusta al pie del PDF original del albaran
        y sube el PDF firmado reemplazando al original.
        Tambien avanza el estado del pedido a 3 (Oficina).
        """

        # 1. Obtener pedido y verificar que tiene PDF
        pedido = (
            supabase_admin
            .table("pedidos")
            .select("*")
            .eq("id", pedido_id)
            .maybe_single()
            .execute()
        )

        if not pedido.data:
            return {"error": "Pedido no encontrado"}

        if int(pedido.data["estado"]) != 2:
            return {"error": "El pedido no esta en estado Transportista"}

        nombre_archivo = pedido.data.get("pdf_url")
        if not nombre_archivo:
            return {"error": "Este pedido no tiene PDF"}

        # 2. Descargar PDF original de Supabase Storage
        try:
            pdf_bytes = supabase_admin.storage.from_(self.BUCKET).download(nombre_archivo)
        except Exception as e:
            print(f"[FIRMA][ERROR] Error descargando PDF: {e}")
            return {"error": "Error descargando PDF original"}

        # 3. Decodificar la imagen de firma (base64 data URL → bytes)
        try:
            # Remove data URL prefix if present: "data:image/png;base64,..."
            if "," in firma_base64:
                firma_base64 = firma_base64.split(",", 1)[1]
            firma_bytes = base64.b64decode(firma_base64)
        except Exception as e:
            print(f"[FIRMA][ERROR] Error decodificando firma: {e}")
            return {"error": "Firma invalida"}

        # 4. Leer PDF original
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            print(f"[FIRMA][ERROR] Error leyendo PDF: {e}")
            return {"error": "Error procesando PDF"}

        fecha_firma = datetime.now().strftime("%d/%m/%Y %H:%M")
        
        font = fitz.Font("helv")
        def center_text(page, text, text_y, firma_x, firma_width, font_size, color):
            w = font.text_length(text, fontsize=font_size)
            x_pos = firma_x + (firma_width - w) / 2
            page.insert_text((x_pos, text_y), text, fontsize=font_size, color=color, fontname="helv")

        # 5. Procesar SOLO la primera pagina para la firma
        if len(doc) > 0:
            page = doc[0]
            rect = page.rect
            
            # Igualar la rotacion que aplicamos en el preview (para que la firma cuadre)
            if rect.width > rect.height:
                page.set_rotation(page.rotation + 270)
                rect = page.rect 
            
            # La imagen de la firma enviada desde el frontend tiene el mismo aspect ratio 
            # y coordenadas relativas al documento completo
            firma_rect = fitz.Rect(0, 0, rect.width, rect.height)
            page.insert_image(firma_rect, stream=firma_bytes)

        # 7. Generar PDF firmado
        signed_bytes = doc.write()
        print(f"[FIRMA] PDF original: {len(pdf_bytes)} bytes, PDF firmado: {len(signed_bytes)} bytes")

        # 8. Subir PDF firmado a Supabase con nombre distinto (mantener original)
        nombre_firmado = nombre_archivo.replace(".pdf", f"_firmado_{uuid.uuid4().hex[:6]}.pdf")
        try:
            supabase_admin.storage.from_(self.BUCKET).upload(
                nombre_firmado,
                signed_bytes,
                {"content-type": "application/pdf"}
            )
            print(f"[FIRMA] PDF firmado subido: {nombre_firmado}")
        except Exception as e:
            print(f"[FIRMA][ERROR] Error subiendo PDF firmado: {e}")
            return {"error": f"Error subiendo PDF firmado: {e}"}

        # 9. Guardar ruta del PDF firmado sin avanzar estado
        try:
            supabase_admin.table("pedidos").update({
                "pdf_firmado": nombre_firmado
            }).eq("id", pedido_id).execute()
            print(f"[FIRMA] Pedido {pedido_id} pdf_firmado actualizado: {nombre_firmado}")
        except Exception as e:
            print(f"[FIRMA][ERROR] Error actualizando BD: {e}")
            return {"error": "PDF firmado pero error al actualizar estado en BD"}

        return {"message": "Firma incrustada en el PDF. Revisa el documento.", "pedido_id": pedido_id}

    def exportar_a_excel(self, pedido_id):
        response = supabase_admin.table("pedido_productos").select("*").eq("pedido_id", pedido_id).execute()
        
        productos = response.data
        
        print("Productos obtenidos:", productos)
        
        wb = Workbook()
        ws = wb.active
        
        ws.append(["Código", "Nombre", "Cantidad", "Precio"])

        for producto in productos:
            ws.append([
                producto['id'],
                producto['nombre_producto'],
                producto['cantidad'],
                producto.get('precio', 0)
            ])
        
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        return output
        