import cv2
import numpy as np
import os

img_path = 'edited-image.png'

if os.path.exists(img_path):
    img = cv2.imread(img_path)
    if img is not None:
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply threshold to isolate the dark green logo from the light background
        # The background bars are very light, so 180 is a safe threshold
        ret, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours
        contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        h, w = gray.shape
        svg_path = ""
        
        for contour in contours:
            # Smooth/simplify the contour
            epsilon = 0.001 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            if len(approx) > 2:
                # Build path string
                path_str = "M " + " L ".join([f"{pt[0][0]},{pt[0][1]}" for pt in approx]) + " Z "
                svg_path += path_str
        
        # Create SVG content with the primary brand color
        svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
        <path d="{svg_path}" fill="#0A2618" fill-rule="evenodd" />
        </svg>"""
        
        with open('ellus_logo.svg', 'w') as f:
            f.write(svg_content)
        print("Success: ellus_logo.svg generated.")
    else:
        print("Error: Could not read image.")
else:
    print("Error: File not found.")
