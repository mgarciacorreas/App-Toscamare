from pathlib import Path

from pdf2image import convert_from_path
from PIL import Image, ImageEnhance, ImageFilter

from .ocr import normalize_orientation


def convert_pdf_to_images(pdf_path, output_dir, dpi=300, correct_orientation=True, lang='spa+por'):
    """
    Convierte un archivo PDF en imágenes (una por página)
    
    Args:
        pdf_path: Ruta al archivo PDF
        output_dir: Directorio donde guardar las imágenes
        dpi: Resolución de la imagen (mayor = mejor calidad OCR, pero más pesado)
    
    Returns:
        Lista de rutas a las imágenes generadas
    """
    pdf_path = Path(pdf_path)
    output_dir = Path(output_dir)
    
    # Convertir PDF a imágenes
    images = convert_from_path(pdf_path, dpi=dpi)
    
    image_files = []
    for i, image in enumerate(images, start=1):
        # Preprocesar la imagen para mejorar OCR
        image = basic_preprocess(image)

        if correct_orientation:
            image = normalize_orientation(image, lang=lang, prefer_portrait=True)

        image = binarize_image(image)
        
        # Guardar imagen
        output_file = output_dir / f"{pdf_path.stem}_page_{i}.png"
        image.save(output_file, 'PNG')
        image_files.append(output_file)
    
    return image_files


def preprocess_image(image):
    """
    Preprocesa la imagen para mejorar la precision del OCR

    Args:
        image: Objeto PIL Image

    Returns:
        Imagen preprocesada
    """
    image = basic_preprocess(image)
    image = binarize_image(image)
    return image


def basic_preprocess(image):
    """
    Preprocesa la imagen para mejorar la precisión del OCR
    
    Args:
        image: Objeto PIL Image
    
    Returns:
        Imagen preprocesada
    """
    # Convertir a escala de grises
    image = image.convert('L')
    
    # Redimensionar si es muy pequeña (aumenta resolución)
    width, height = image.size
    if width < 2000:  # Si es menor a 2000px de ancho, ampliar
        scale_factor = 2000 / width
        new_size = (int(width * scale_factor), int(height * scale_factor))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Aumentar contraste de forma más agresiva
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.5)  # Más contraste
    
    # Aumentar nitidez
    enhancer = ImageEnhance.Sharpness(image)
    image = enhancer.enhance(2.0)  # Más nitidez
    
    # Aplicar filtro para reducir ruido
    image = image.filter(ImageFilter.MedianFilter(size=3))
    
    return image


def binarize_image(image):
    """
    Aplica binarizacion con metodo de Otsu.
    """
    # Convertir a numpy para procesamiento avanzado
    import numpy as np

    img_array = np.array(image)

    # Calcular umbral optimo (Otsu)
    threshold = calculate_otsu_threshold(img_array)

    # Aplicar umbral
    bin_array = np.where(img_array > threshold, 255, 0).astype(np.uint8)

    # Si la imagen queda casi toda negra o blanca, usar umbral fijo
    white_ratio = float((bin_array == 255).sum()) / float(bin_array.size)
    if white_ratio < 0.02 or white_ratio > 0.98:
        bin_array = np.where(img_array > 128, 255, 0).astype(np.uint8)

    # Convertir de vuelta a PIL
    return Image.fromarray(bin_array)


def calculate_otsu_threshold(image_array):
    """
    Calcula el umbral óptimo usando el método de Otsu
    
    Args:
        image_array: Array numpy de la imagen en escala de grises
    
    Returns:
        Umbral óptimo
    """
    import numpy as np
    
    # Calcular histograma
    hist, bin_edges = np.histogram(image_array, bins=256, range=(0, 256))
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2
    
    # Normalizar histograma
    hist = hist.astype(float) / hist.sum()
    
    # Calcular varianza entre clases para cada umbral posible
    weight1 = np.cumsum(hist)
    weight2 = 1 - weight1
    
    mean1 = np.cumsum(hist * bin_centers) / (weight1 + 1e-10)
    mean2 = (np.cumsum((hist * bin_centers)[::-1])[::-1]) / (weight2 + 1e-10)
    
    variance12 = weight1 * weight2 * (mean1 - mean2) ** 2
    
    # Encontrar el umbral que maximiza la varianza
    threshold = np.argmax(variance12)
    
    return threshold