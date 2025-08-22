"""
API endpoints for Rare Material Detection and Handling System
Provides REST API for detecting rare materials and managing handling protocols
"""

import asyncio
import json
import logging
import base64
from typing import Dict, List, Any, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body, File, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# Import detection system
from rare_material_detection import (
    RareMaterialDetector,
    RareMaterialType,
    MaterialValue,
    RareMaterial,
    DetectionResult,
    HandlingProtocol,
    NotificationPriority
)
from multi_modal_sensor_fusion import SpectralData, ChemicalData
from rare_material_detection import (
    detect_rare_materials_api,
    get_handling_protocol
)
from multi_modal_sensor_fusion import SpectralData, ChemicalData

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize detector
rare_material_detector = RareMaterialDetector()

# Initialize FastAPI app
app = FastAPI(
    title="Rare Material Detection API",
    description="API for detecting and handling rare materials in waste streams",
    version="1.0.0"
)

# Pydantic models for API
class SpectralDataModel(BaseModel):
    wavelengths: List[float]
    intensities: List[float]
    spectrum_type: str
    resolution: float
    integration_time: float

class ChemicalDataModel(BaseModel):
    elements: Dict[str, float]
    compounds: Dict[str, float]
    ph_level: float
    moisture_content: float
    organic_content: float

class DetectionRequest(BaseModel):
    spectral_data: Optional[SpectralDataModel] = None
    chemical_data: Optional[ChemicalDataModel] = None
    image_base64: Optional[str] = None

class NotificationConfig(BaseModel):
    stakeholders: List[str]
    priority_threshold: str
    notification_channels: List[str]
    custom_message: Optional[str] = None

class HandlingProtocolRequest(BaseModel):
    material_type: str
    quantity: float
    purity: float
    custom_requirements: Optional[List[str]] = None

@app.post("/api/detect-rare-materials", response_model=Dict[str, Any])
async def detect_rare_materials_endpoint(
    request: DetectionRequest = Body(...)
):
    """
    Detect rare materials using multi-modal analysis
    """
    try:
        # Convert image data if provided
        image_data = None
        if request.image_base64:
            try:
                image_data = base64.b64decode(request.image_base64)
            except Exception as e:
                logger.error(f"Failed to decode base64 image: {e}")
                raise HTTPException(status_code=400, detail="Invalid image data")
        
        # Convert spectral data if provided
        spectral_data = None
        if request.spectral_data:
            spectral_data = SpectralData(
                wavelengths=request.spectral_data.wavelengths,
                intensities=request.spectral_data.intensities,
                spectrum_type=request.spectral_data.spectrum_type,
                resolution=request.spectral_data.resolution,
                integration_time=request.spectral_data.integration_time
            )
        
        # Convert chemical data if provided
        chemical_data = None
        if request.chemical_data:
            chemical_data = ChemicalData(
                elements=request.chemical_data.elements,
                compounds=request.chemical_data.compounds,
                ph_level=request.chemical_data.ph_level,
                moisture_content=request.chemical_data.moisture_content,
                organic_content=request.chemical_data.organic_content
            )
        
        # Perform detection
        result = await detect_rare_materials_api(image_data, spectral_data, chemical_data)
        return result
        
    except Exception as e:
        logger.error(f"Error in rare material detection endpoint: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/handling-protocol", response_model=Dict[str, Any])
async def handling_protocol_endpoint(
    request: HandlingProtocolRequest = Body(...)
):
    """
    Get handling protocol for specific material type
    """
    try:
        result = await get_handling_protocol(
            request.material_type,
            request.quantity,
            request.purity,
            request.custom_requirements
        )
        return result
        
    except Exception as e:
        logger.error(f"Error in handling protocol endpoint: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/stakeholder-notifications", response_model=Dict[str, Any])
async def stakeholder_notifications_endpoint(
    material_name: str,
    material_type: str,
    value: float,
    config: NotificationConfig = Body(...)
):
    """
    Configure and send stakeholder notifications for rare material discoveries
    """
    try:
        # Convert material type string to enum
        try:
            material_type_enum = RareMaterialType(material_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid material type: {material_type}")
        
        # Convert priority threshold
        try:
            priority_threshold = NotificationPriority[config.priority_threshold.upper()]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid priority threshold: {config.priority_threshold}")
        
        # Create material object
        material = RareMaterial(
            material_name=material_name,
            material_type=material_type_enum,
            chemical_formula="",  # Not needed for notification
            market_value_per_kg=value,
            purity_percentage=100.0,  # Default
            quantity_detected=1.0,    # Default
            confidence=1.0,           # Default
            extraction_difficulty="",  # Not needed for notification
            market_demand="",          # Not needed for notification
            applications=[],           # Not needed for notification
            handling_requirements=[]   # Not needed for notification
        )
        
        # Send notifications
        result = await send_stakeholder_notifications(
            [material],
            config.stakeholders,
            priority_threshold,
            config.notification_channels,
            config.custom_message
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in stakeholder notifications endpoint: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/upload-material-image", response_model=Dict[str, Any])
async def upload_material_image(
    file: UploadFile = File(...)
):
    """
    Upload image for rare material detection
    """
    try:
        # Read image data
        image_data = await file.read()
        
        # Perform detection with image only
        result = await detect_rare_materials_api(image_data, None, None)
        return result
        
    except Exception as e:
        logger.error(f"Error in image upload endpoint: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

async def detect_rare_materials_api(
    image_data: Optional[bytes],
    spectral_data: Optional[SpectralData],
    chemical_data: Optional[ChemicalData]
) -> Dict[str, Any]:
    """
    API function for rare material detection
    """
    try:
        if not image_data and not spectral_data and not chemical_data:
            return {
                "error": "At least one data source (image, spectral, or chemical) must be provided",
                "timestamp": datetime.now().isoformat()
            }
        
        # Perform detection
        result = await rare_material_detector.detect_rare_materials(
            image_data=image_data,
            spectral_data=spectral_data,
            chemical_data=chemical_data
        )
        
        # Convert to API response format
        response = {
            "materials_detected": [
                {
                    "material_name": m.material_name,
                    "material_type": m.material_type.value,
                    "chemical_formula": m.chemical_formula,
                    "market_value_per_kg": m.market_value_per_kg,
                    "purity_percentage": m.purity_percentage,
                    "quantity_detected": m.quantity_detected,
                    "confidence": m.confidence,
                    "extraction_difficulty": m.extraction_difficulty,
                    "market_demand": m.market_demand,
                    "applications": m.applications,
                    "handling_requirements": m.handling_requirements,
                    "total_value": m.market_value_per_kg * m.quantity_detected * (m.purity_percentage / 100.0)
                }
                for m in result.materials_detected
            ],
            "total_estimated_value": result.total_estimated_value,
            "highest_value_material": (
                {
                    "material_name": result.highest_value_material.material_name,
                    "material_type": result.highest_value_material.material_type.value,
                    "total_value": result.highest_value_material.market_value_per_kg * 
                                  result.highest_value_material.quantity_detected * 
                                  (result.highest_value_material.purity_percentage / 100.0)
                }
                if result.highest_value_material else None
            ),
            "detection_confidence": result.detection_confidence,
            "recommended_actions": result.recommended_actions,
            "special_handling_required": result.special_handling_required,
            "stakeholder_notifications": result.stakeholder_notifications,
            "extraction_feasibility": result.extraction_feasibility,
            "market_analysis": result.market_analysis,
            "timestamp": datetime.now().isoformat()
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in rare material detection API: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

async def get_handling_protocol(
    material_type: str,
    quantity: float = 0.0,
    purity: float = 0.0,
    custom_requirements: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    API function to get handling protocol for specific material type
    """
    try:
        # Convert material type string to enum
        try:
            material_type_enum = RareMaterialType(material_type)
        except ValueError:
            return {
                "error": f"Invalid material type: {material_type}",
                "timestamp": datetime.now().isoformat()
            }
        
        # Get base protocol
        protocol = rare_material_detector.handling_protocols.get(material_type_enum)
        
        if not protocol:
            return {
                "error": f"No handling protocol found for material type: {material_type}",
                "timestamp": datetime.now().isoformat()
            }
        
        # Customize protocol based on quantity and purity
        customized_protocol = await rare_material_detector.customize_handling_protocol(
            protocol, quantity, purity, custom_requirements
        )
        
        # Convert to API response format
        response = {
            "protocol_id": customized_protocol.protocol_id,
            "material_type": customized_protocol.material_type.value,
            "safety_requirements": customized_protocol.safety_requirements,
            "equipment_needed": customized_protocol.equipment_needed,
            "extraction_steps": customized_protocol.extraction_steps,
            "storage_conditions": customized_protocol.storage_conditions,
            "transportation_requirements": customized_protocol.transportation_requirements,
            "regulatory_compliance": customized_protocol.regulatory_compliance,
            "timestamp": datetime.now().isoformat()
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in handling protocol API: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

async def send_stakeholder_notifications(
    materials: List[RareMaterial],
    stakeholders: List[str],
    priority_threshold: NotificationPriority,
    notification_channels: List[str],
    custom_message: Optional[str] = None
) -> Dict[str, Any]:
    """
    API function to send stakeholder notifications
    """
    try:
        # Determine notification priority based on material value
        total_value = sum(m.market_value_per_kg * m.quantity_detected * (m.purity_percentage / 100.0) for m in materials)
        
        # Send notifications through notification system
        notification_results = await rare_material_detector.send_stakeholder_notifications(
            materials=materials,
            stakeholders=stakeholders,
            priority_threshold=priority_threshold,
            notification_channels=notification_channels,
            custom_message=custom_message
        )
        
        # Convert to API response format
        response = {
            "notification_id": notification_results.get("notification_id", ""),
            "materials_notified": [m.material_name for m in materials],
            "stakeholders_notified": notification_results.get("stakeholders_notified", []),
            "notification_channels": notification_results.get("channels_used", []),
            "notification_priority": notification_results.get("priority", ""),
            "notification_status": notification_results.get("status", ""),
            "timestamp": datetime.now().isoformat()
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in stakeholder notification API: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }