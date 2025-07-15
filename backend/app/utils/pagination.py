o d"""
Pagination utility
"""
from flask import request


def paginate(query, page=None, per_page=None):
    """Paginate a SQLAlchemy query"""
    if page is None:
        page = request.args.get('page', 1, type=int)
    
    if per_page is None:
        per_page = request.args.get('per_page', 20, type=int)
    
    # Limit per_page to prevent abuse
    per_page = min(per_page, 100)
    
    return query.paginate(page=page, per_page=per_page, error_out=False)