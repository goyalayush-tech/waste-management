how """
Input validators
"""
import re


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength"""
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return "Password must contain at least one number"
    
    return None


def validate_phone(phone):
    """Validate Indian phone number"""
    # Remove spaces and dashes
    phone = phone.replace(' ', '').replace('-', '')
    
    # Check for Indian phone number format
    pattern = r'^(\+91)?[6-9]\d{9}$'
    return re.match(pattern, phone) is not None


def validate_gst(gst_number):
    """Validate Indian GST number"""
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    return re.match(pattern, gst_number) is not None


def validate_coordinates(lat, lng):
    """Validate latitude and longitude"""
    try:
        lat = float(lat)
        lng = float(lng)
        
        if not -90 <= lat <= 90:
            return "Latitude must be between -90 and 90"
        
        if not -180 <= lng <= 180:
            return "Longitude must be between -180 and 180"
        
        return None
    except (TypeError, ValueError):
        return "Invalid coordinates format"