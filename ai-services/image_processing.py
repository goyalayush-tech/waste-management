"""
Advanced Image Processing Service for Waste Management
Handles image preprocessing, enhancement, and analysis for waste classification
"""

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import tensorflow as tf
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
from typing import Dict, List, Tuple, Optional
import logging
import base64
import io

class ImageProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_models()
        
    def setup_models(self):
        """Initialize image processing models"""
        try:
            # Load pre-trained models for various tasks
            self.edge_detector = cv2.createLineSegmentDetector()
            self.background_subtractor = cv2.createBackgroundSubtractorMOG2()
            
            # Initialize filters and kernels
            self.gaussian_kernel = cv2.getGaussianKernel(5, 1)
            self.sobel_x = cv2.Sobel
            self.sobel_y = cv2.Sobel
            
            self.logger.info("Image processing models initialized successfully")
        except Exception as e:
            self.logger.error(f"Error initializing models: {e}")
            
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """
        Preprocess image for waste classification
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Preprocessed image array
        """
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            # Resize to standard dimensions
            image = image.resize((224, 224), Image.Resampling.LANCZOS)
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Normalize pixel values
            img_array = img_array.astype(np.float32) / 255.0
            
            # Apply noise reduction
            img_array = self.denoise_image(img_array)
            
            # Enhance contrast
            img_array = self.enhance_contrast(img_array)
            
            return img_array
            
        except Exception as e:
            self.logger.error(f"Error preprocessing image: {e}")
            return None
            
    def denoise_image(self, image: np.ndarray) -> np.ndarray:
        """Remove noise from image using advanced filtering"""
        try:
            # Convert to uint8 for OpenCV operations
            img_uint8 = (image * 255).astype(np.uint8)
            
            # Apply bilateral filter for noise reduction while preserving edges
            denoised = cv2.bilateralFilter(img_uint8, 9, 75, 75)
            
            # Apply non-local means denoising
            denoised = cv2.fastNlMeansDenoisingColored(denoised, None, 10, 10, 7, 21)
            
            # Convert back to float32
            return denoised.astype(np.float32) / 255.0
            
        except Exception as e:
            self.logger.error(f"Error denoising image: {e}")
            return image
            
    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance image contrast using CLAHE"""
        try:
            # Convert to LAB color space
            img_uint8 = (image * 255).astype(np.uint8)
            lab = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2LAB)
            
            # Apply CLAHE to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            
            # Convert back to RGB
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
            
            return enhanced.astype(np.float32) / 255.0
            
        except Exception as e:
            self.logger.error(f"Error enhancing contrast: {e}")
            return image
            
    def extract_features(self, image: np.ndarray) -> Dict:
        """Extract comprehensive features from image"""
        try:
            features = {}
            
            # Color features
            features.update(self.extract_color_features(image))
            
            # Texture features
            features.update(self.extract_texture_features(image))
            
            # Shape features
            features.update(self.extract_shape_features(image))
            
            # Edge features
            features.update(self.extract_edge_features(image))
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting features: {e}")
            return {}
            
    def extract_color_features(self, image: np.ndarray) -> Dict:
        """Extract color-based features"""
        try:
            features = {}
            
            # Convert to different color spaces
            img_uint8 = (image * 255).astype(np.uint8)
            hsv = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2HSV)
            lab = cv2.cvtColor(img_uint8, cv2.COLOR_RGB2LAB)
            
            # RGB statistics
            features['rgb_mean'] = np.mean(image, axis=(0, 1)).tolist()
            features['rgb_std'] = np.std(image, axis=(0, 1)).tolist()
            
            # HSV statistics
            features['hsv_mean'] = np.mean(hsv, axis=(0, 1)).tolist()
            features['hsv_std'] = np.std(hsv, axis=(0, 1)).tolist()
            
            # Color histogram
            hist_r = cv2.calcHist([img_uint8], [0], None, [256], [0, 256])
            hist_g = cv2.calcHist([img_uint8], [1], None, [256], [0, 256])
            hist_b = cv2.calcHist([img_uint8], [2], None, [256], [0, 256])
            
            features['color_histogram'] = {
                'red': hist_r.flatten().tolist(),
                'green': hist_g.flatten().tolist(),
                'blue': hist_b.flatten().tolist()
            }
            
            # Dominant colors using K-means
            dominant_colors = self.get_dominant_colors(image)
            features['dominant_colors'] = dominant_colors
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting color features: {e}")
            return {}
            
    def extract_texture_features(self, image: np.ndarray) -> Dict:
        """Extract texture-based features using GLCM and LBP"""
        try:
            features = {}
            
            # Convert to grayscale
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            
            # Local Binary Pattern
            lbp = self.calculate_lbp(gray)
            features['lbp_histogram'] = cv2.calcHist([lbp], [0], None, [256], [0, 256]).flatten().tolist()
            
            # Gabor filters for texture analysis
            gabor_responses = self.apply_gabor_filters(gray)
            features['gabor_features'] = gabor_responses
            
            # Haralick texture features (simplified)
            features['texture_energy'] = np.sum(gray ** 2) / (gray.shape[0] * gray.shape[1])
            features['texture_entropy'] = -np.sum(gray * np.log2(gray + 1e-10))
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting texture features: {e}")
            return {}
            
    def extract_shape_features(self, image: np.ndarray) -> Dict:
        """Extract shape-based features"""
        try:
            features = {}
            
            # Convert to grayscale and threshold
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            
            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Get largest contour
                largest_contour = max(contours, key=cv2.contourArea)
                
                # Shape features
                area = cv2.contourArea(largest_contour)
                perimeter = cv2.arcLength(largest_contour, True)
                
                features['area'] = float(area)
                features['perimeter'] = float(perimeter)
                features['aspect_ratio'] = self.calculate_aspect_ratio(largest_contour)
                features['solidity'] = self.calculate_solidity(largest_contour)
                features['extent'] = self.calculate_extent(largest_contour)
                
                # Hu moments
                moments = cv2.moments(largest_contour)
                hu_moments = cv2.HuMoments(moments)
                features['hu_moments'] = hu_moments.flatten().tolist()
                
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting shape features: {e}")
            return {}
            
    def extract_edge_features(self, image: np.ndarray) -> Dict:
        """Extract edge-based features"""
        try:
            features = {}
            
            # Convert to grayscale
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            
            # Canny edge detection
            edges = cv2.Canny(gray, 50, 150)
            
            # Edge density
            edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
            features['edge_density'] = float(edge_density)
            
            # Edge direction histogram
            sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
            
            gradient_direction = np.arctan2(sobel_y, sobel_x)
            direction_hist, _ = np.histogram(gradient_direction, bins=36, range=(-np.pi, np.pi))
            features['edge_direction_histogram'] = direction_hist.tolist()
            
            # Line detection using Hough transform
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            features['line_count'] = len(lines) if lines is not None else 0
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting edge features: {e}")
            return {}
            
    def get_dominant_colors(self, image: np.ndarray, k: int = 5) -> List[List[int]]:
        """Extract dominant colors using K-means clustering"""
        try:
            # Reshape image to be a list of pixels
            pixels = image.reshape(-1, 3)
            
            # Apply K-means clustering
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            kmeans.fit(pixels)
            
            # Get cluster centers (dominant colors)
            colors = kmeans.cluster_centers_
            
            # Convert to 0-255 range and return as integers
            return (colors * 255).astype(int).tolist()
            
        except Exception as e:
            self.logger.error(f"Error extracting dominant colors: {e}")
            return []
            
    def calculate_lbp(self, image: np.ndarray, radius: int = 1, n_points: int = 8) -> np.ndarray:
        """Calculate Local Binary Pattern"""
        try:
            height, width = image.shape
            lbp = np.zeros((height, width), dtype=np.uint8)
            
            for i in range(radius, height - radius):
                for j in range(radius, width - radius):
                    center = image[i, j]
                    binary_string = ""
                    
                    for k in range(n_points):
                        angle = 2 * np.pi * k / n_points
                        x = int(i + radius * np.cos(angle))
                        y = int(j + radius * np.sin(angle))
                        
                        if image[x, y] >= center:
                            binary_string += "1"
                        else:
                            binary_string += "0"
                    
                    lbp[i, j] = int(binary_string, 2)
            
            return lbp
            
        except Exception as e:
            self.logger.error(f"Error calculating LBP: {e}")
            return np.zeros_like(image)
            
    def apply_gabor_filters(self, image: np.ndarray) -> Dict:
        """Apply Gabor filters for texture analysis"""
        try:
            responses = {}
            
            # Different orientations and frequencies
            orientations = [0, 45, 90, 135]
            frequencies = [0.1, 0.3, 0.5]
            
            for orientation in orientations:
                for frequency in frequencies:
                    # Create Gabor kernel
                    kernel = cv2.getGaborKernel((21, 21), 5, np.radians(orientation), 
                                              2*np.pi*frequency, 0.5, 0, ktype=cv2.CV_32F)
                    
                    # Apply filter
                    filtered = cv2.filter2D(image, cv2.CV_8UC3, kernel)
                    
                    # Calculate response statistics
                    key = f"gabor_{orientation}_{frequency}"
                    responses[key] = {
                        'mean': float(np.mean(filtered)),
                        'std': float(np.std(filtered)),
                        'energy': float(np.sum(filtered ** 2))
                    }
            
            return responses
            
        except Exception as e:
            self.logger.error(f"Error applying Gabor filters: {e}")
            return {}
            
    def calculate_aspect_ratio(self, contour: np.ndarray) -> float:
        """Calculate aspect ratio of contour"""
        try:
            x, y, w, h = cv2.boundingRect(contour)
            return float(w) / float(h)
        except:
            return 1.0
            
    def calculate_solidity(self, contour: np.ndarray) -> float:
        """Calculate solidity of contour"""
        try:
            area = cv2.contourArea(contour)
            hull = cv2.convexHull(contour)
            hull_area = cv2.contourArea(hull)
            return float(area) / float(hull_area) if hull_area > 0 else 0.0
        except:
            return 0.0
            
    def calculate_extent(self, contour: np.ndarray) -> float:
        """Calculate extent of contour"""
        try:
            area = cv2.contourArea(contour)
            x, y, w, h = cv2.boundingRect(contour)
            rect_area = w * h
            return float(area) / float(rect_area) if rect_area > 0 else 0.0
        except:
            return 0.0
            
    def segment_waste_objects(self, image: np.ndarray) -> List[Dict]:
        """Segment individual waste objects in image"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            
            # Apply threshold
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Morphological operations to clean up
            kernel = np.ones((3, 3), np.uint8)
            binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
            
            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            objects = []
            for i, contour in enumerate(contours):
                if cv2.contourArea(contour) > 100:  # Filter small objects
                    # Get bounding box
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    # Extract object region
                    object_region = image[y:y+h, x:x+w]
                    
                    # Extract features for this object
                    object_features = self.extract_features(object_region)
                    
                    objects.append({
                        'id': i,
                        'bbox': [int(x), int(y), int(w), int(h)],
                        'area': float(cv2.contourArea(contour)),
                        'features': object_features
                    })
            
            return objects
            
        except Exception as e:
            self.logger.error(f"Error segmenting objects: {e}")
            return []
            
    def analyze_image_quality(self, image: np.ndarray) -> Dict:
        """Analyze image quality metrics"""
        try:
            quality_metrics = {}
            
            # Convert to grayscale for some metrics
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            
            # Brightness
            quality_metrics['brightness'] = float(np.mean(gray))
            
            # Contrast (standard deviation)
            quality_metrics['contrast'] = float(np.std(gray))
            
            # Sharpness (Laplacian variance)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            quality_metrics['sharpness'] = float(laplacian.var())
            
            # Noise estimation
            quality_metrics['noise_level'] = self.estimate_noise(gray)
            
            # Color distribution
            quality_metrics['color_diversity'] = self.calculate_color_diversity(image)
            
            return quality_metrics
            
        except Exception as e:
            self.logger.error(f"Error analyzing image quality: {e}")
            return {}
            
    def estimate_noise(self, image: np.ndarray) -> float:
        """Estimate noise level in image"""
        try:
            # Use Laplacian to estimate noise
            laplacian = cv2.Laplacian(image, cv2.CV_64F)
            noise_level = laplacian.var()
            return float(noise_level)
        except:
            return 0.0
            
    def calculate_color_diversity(self, image: np.ndarray) -> float:
        """Calculate color diversity using entropy"""
        try:
            # Convert to HSV and use hue channel
            hsv = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2HSV)
            hue = hsv[:, :, 0]
            
            # Calculate histogram
            hist, _ = np.histogram(hue, bins=180, range=(0, 180))
            
            # Normalize
            hist = hist / np.sum(hist)
            
            # Calculate entropy
            entropy = -np.sum(hist * np.log2(hist + 1e-10))
            
            return float(entropy)
            
        except:
            return 0.0
            
    def create_visualization(self, image: np.ndarray, features: Dict) -> bytes:
        """Create visualization of extracted features"""
        try:
            fig, axes = plt.subplots(2, 3, figsize=(15, 10))
            
            # Original image
            axes[0, 0].imshow(image)
            axes[0, 0].set_title('Original Image')
            axes[0, 0].axis('off')
            
            # Color histogram
            if 'color_histogram' in features:
                hist = features['color_histogram']
                axes[0, 1].plot(hist['red'], color='red', alpha=0.7)
                axes[0, 1].plot(hist['green'], color='green', alpha=0.7)
                axes[0, 1].plot(hist['blue'], color='blue', alpha=0.7)
                axes[0, 1].set_title('Color Histogram')
            
            # Dominant colors
            if 'dominant_colors' in features:
                colors = np.array(features['dominant_colors']) / 255.0
                axes[0, 2].imshow([colors])
                axes[0, 2].set_title('Dominant Colors')
                axes[0, 2].axis('off')
            
            # Edge detection
            gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            axes[1, 0].imshow(edges, cmap='gray')
            axes[1, 0].set_title('Edge Detection')
            axes[1, 0].axis('off')
            
            # Texture (LBP)
            lbp = self.calculate_lbp(gray)
            axes[1, 1].imshow(lbp, cmap='gray')
            axes[1, 1].set_title('Local Binary Pattern')
            axes[1, 1].axis('off')
            
            # Feature summary
            summary_text = f"""
            Brightness: {features.get('brightness', 'N/A'):.2f}
            Contrast: {features.get('contrast', 'N/A'):.2f}
            Sharpness: {features.get('sharpness', 'N/A'):.2f}
            Edge Density: {features.get('edge_density', 'N/A'):.4f}
            """
            axes[1, 2].text(0.1, 0.5, summary_text, fontsize=10, verticalalignment='center')
            axes[1, 2].set_title('Feature Summary')
            axes[1, 2].axis('off')
            
            plt.tight_layout()
            
            # Save to bytes
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            
            plt.close()
            
            return buffer.getvalue()
            
        except Exception as e:
            self.logger.error(f"Error creating visualization: {e}")
            return b''

# Global instance
image_processor = ImageProcessor()