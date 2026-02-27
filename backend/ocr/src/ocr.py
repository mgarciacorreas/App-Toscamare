import pytesseract
from PIL import Image, ImageOps


def process_image_with_ocr(image_path, lang='spa+por'):
    """
    Procesa una imagen con Tesseract OCR
    
    Args:
        image_path: Ruta a la imagen
        lang: Idiomas para OCR (español + portugués para albaranes de lonja)
    
    Returns:
        Texto extraído de la imagen
    """
    image = Image.open(image_path)

    # PASO 1: Detectar orientación y rotar si es necesario
    image = normalize_orientation(image, lang=lang, prefer_portrait=True)
    
    # PASO 2: Procesar OCR con la imagen correctamente orientada
    # Configuración de Tesseract optimizada para documentos tabulares
    # PSM 4 es mejor para documentos con columnas
    custom_config = r'--oem 3 --psm 4 -c preserve_interword_spaces=1'
    # --oem 3: usa LSTM neural network (más preciso)
    # --psm 4: asume una columna de texto con tamaños variables
    # preserve_interword_spaces: mantiene espacios entre palabras
    
    try:
        text = pytesseract.image_to_string(image, lang=lang, config=custom_config)
        return text
    except Exception as e:
        print(f"⚠️  Error en OCR con psm 4: {e}")
        # Intentar con PSM 6 si falla
        try:
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(image, lang=lang, config=custom_config)
            return text
        except:
            # Último intento con inglés
            try:
                text = pytesseract.image_to_string(image, lang='eng')
                return text
            except:
                return ""


def _parse_osd_rotation(osd_text):
    for line in osd_text.split('\n'):
        if 'Rotate' in line:
            return int(line.split(':')[1].strip())
    return None


def normalize_orientation(image, lang='spa+por', prefer_portrait=True):
    """
    Corrige la orientacion usando OSD y, si falla, prueba rotaciones.
    """
    image = ImageOps.exif_transpose(image)

    try:
        osd = pytesseract.image_to_osd(image, lang=lang)
        rotation = _parse_osd_rotation(osd)
        if rotation is not None and rotation != 0:
            print(f"   🔄 Rotando imagen {rotation}° para corregir orientacion...")
            # Tesseract devuelve grados en sentido horario; PIL rota en antihorario.
            image = image.rotate(-rotation, expand=True)
    except Exception:
        print("   ⚠️  No se pudo detectar orientacion automaticamente")
        print("   ℹ️  Probando rotaciones manuales...")
        image = try_rotations(image, lang, prefer_portrait=prefer_portrait)
        return image

    if prefer_portrait and image.width > image.height:
        # Si sigue en horizontal, probar rotaciones para buscar texto vertical y legible.
        image = try_rotations(image, lang, prefer_portrait=prefer_portrait)

    return image


def try_rotations(image, lang, prefer_portrait=True):
    """
    Prueba diferentes rotaciones para encontrar la mejor orientación
    
    Args:
        image: Imagen PIL
        lang: Idiomas para OCR
    
    Returns:
        Imagen con la mejor orientación
    """
    print(f"   📊 Probando todas las rotaciones posibles...")
    
    results = []
    
    # Probar rotaciones de 0, 90, 180, 270 grados
    for angle in [0, 90, 180, 270]:
        if angle == 0:
            test_image = image
        else:
            test_image = image.rotate(angle, expand=True)
        
        try:
            # Intentar OCR con configuración rápida
            custom_config = r'--oem 3 --psm 6'
            text = pytesseract.image_to_string(test_image, lang=lang, config=custom_config)
            
            # Métricas para determinar la mejor orientación:
            # 1. Cantidad de caracteres alfabéticos (más = mejor)
            alpha_count = sum(c.isalpha() for c in text)
            
            # 2. Cantidad de palabras reconocibles (más de 2 letras)
            words = text.split()
            word_count = sum(1 for w in words if len(w) > 2 and w.isalpha())
            
            # 3. Cantidad de líneas (documento estructurado tiene varias líneas)
            line_count = len([line for line in text.split('\n') if line.strip()])
            
            # Puntuacion combinada
            score = (alpha_count * 1.0) + (word_count * 5.0) + (line_count * 2.0)
            if prefer_portrait and test_image.height >= test_image.width:
                score += 50.0
            
            results.append({
                'angle': angle,
                'image': test_image,
                'score': score,
                'alpha': alpha_count,
                'words': word_count,
                'lines': line_count
            })
            
            print(
                f"      {angle:3d}° → Letras: {alpha_count:4d} | Palabras: {word_count:3d} | Lineas: {line_count:3d} | Score: {score:.1f}"
            )
            
        except Exception as e:
            print(f"      {angle:3d}° → Error: {e}")
            results.append({
                'angle': angle,
                'image': test_image,
                'score': 0,
                'alpha': 0,
                'words': 0,
                'lines': 0
            })
    
    # Ordenar por puntuación y elegir el mejor
    results.sort(key=lambda x: x['score'], reverse=True)
    best = results[0]
    
    if best['angle'] != 0:
        print(f"   ✅ MEJOR ROTACIÓN: {best['angle']}° (score: {best['score']:.1f})")
    else:
        print(f"   ✅ Orientación original es la mejor")
    
    return best['image']



def get_ocr_data(image_path, lang='eng', config=None):
    """
    Obtiene datos detallados del OCR incluyendo coordenadas
    Útil para análisis más avanzado
    
    Args:
        image_path: Ruta a la imagen
        lang: Idiomas para OCR
    
    Returns:
        Dict con información detallada del OCR
    """
    image = Image.open(image_path)
    image = normalize_orientation(image, lang=lang, prefer_portrait=True)
    
    try:
        if config is None:
            config = r'--oem 3 --psm 4 -c preserve_interword_spaces=1'
        data = pytesseract.image_to_data(
            image,
            lang=lang,
            config=config,
            output_type=pytesseract.Output.DICT
        )
        return data
    except:
        return None