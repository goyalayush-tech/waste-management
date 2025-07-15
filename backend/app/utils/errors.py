loy"""
Error handlers for the application
"""
from flask import jsonify
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import IntegrityError
from marshmallow import ValidationError


def register_error_handlers(app):
    """Register error handlers with the app"""
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle HTTP exceptions"""
        return jsonify({
            'error': e.description,
            'code': e.code
        }), e.code
    
    @app.errorhandler(404)
    def handle_not_found(e):
        """Handle 404 errors"""
        return jsonify({
            'error': 'Resource not found',
            'code': 404
        }), 404
    
    @app.errorhandler(ValidationError)
    def handle_validation_error(e):
        """Handle marshmallow validation errors"""
        return jsonify({
            'error': 'Validation error',
            'messages': e.messages
        }), 400
    
    @app.errorhandler(IntegrityError)
    def handle_integrity_error(e):
        """Handle database integrity errors"""
        return jsonify({
            'error': 'Database integrity error',
            'message': 'A database constraint was violated'
        }), 409
    
    @app.errorhandler(Exception)
    def handle_generic_error(e):
        """Handle generic errors"""
        app.logger.error(f'Unhandled exception: {str(e)}')
        return jsonify({
            'error': 'An unexpected error occurred',
            'message': str(e) if app.debug else 'Internal server error'
        }), 500