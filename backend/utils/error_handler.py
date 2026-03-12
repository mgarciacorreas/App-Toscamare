from flask import jsonify
from werkzeug.exceptions import HTTPException

def respuesta_error(error, codigo=400):
    return jsonify({
        "success": False,
        "error": error,
        "mensaje": error
    }), codigo

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        return respuesta_error("Petición inválida", 400)
    
    @app.errorhandler(401)
    def unauthorized(error):
        return respuesta_error("No autenticado", 401)
    
    @app.errorhandler(403)
    def forbidden(error):
        return respuesta_error("No autorizado", 403)
    
    @app.errorhandler(404)
    def not_found(error):
        return respuesta_error("Recurso no encontrado", 404)
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.exception("Internal server error", exc_info=error)
        return respuesta_error("Error interno del servidor", 500)

    @app.errorhandler(Exception)
    def unhandled_exception(error):
        # Log full traceback so Render runtime logs show the real cause.
        app.logger.exception("Unhandled exception", exc_info=error)
        if isinstance(error, HTTPException):
            return respuesta_error(error.description, error.code)
        return respuesta_error("Error interno del servidor", 500)