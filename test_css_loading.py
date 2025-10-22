#!/usr/bin/env python
"""
Test script to verify CSS loading and CSP compliance
"""
import requests
from bs4 import BeautifulSoup

def test_css_loading():
    """Test that CSS files are loaded correctly and CSP is working"""
    url = "http://127.0.0.1:8000/explore/"
    
    try:
        print(f"Testing CSS loading: {url}")
        
        # Send GET request
        response = requests.get(url, timeout=10)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("SUCCESS: Page loads correctly!")
            
            # Parse HTML to check CSS links
            soup = BeautifulSoup(response.text, 'html.parser')
            css_links = soup.find_all('link', rel='stylesheet')
            
            print(f"Found {len(css_links)} CSS links:")
            for link in css_links:
                href = link.get('href', '')
                nonce = link.get('nonce', '')
                print(f"  - {href}")
                if nonce:
                    print(f"    Nonce: {nonce}")
                
                # Check if map-legend.css is included
                if 'map-legend.css' in href:
                    print("    ✅ Map legend CSS found!")
                elif 'main.css' in href:
                    print("    ✅ Main CSS found!")
            
            # Check for map legend elements
            legend_elements = soup.find_all('span', class_='legend-marker')
            print(f"Found {len(legend_elements)} legend marker elements:")
            for element in legend_elements:
                classes = element.get('class', [])
                print(f"  - Classes: {classes}")
            
            # Check CSP headers
            csp_header = response.headers.get('Content-Security-Policy', '')
            if csp_header:
                print("CSP Header found:")
                print(f"  {csp_header[:100]}...")
                
        else:
            print(f"ERROR: Got status {response.status_code}")
            print(f"   Response content: {response.text[:500]}...")
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to server")
        print("   Make sure the Django server is running on http://127.0.0.1:8000")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_css_loading()
