
import urllib.request
import ssl
import zipfile
import os
import json

# Setup paths
BASE_DIR = os.getcwd()
DATA_DIR = os.path.join(BASE_DIR, 'public', 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def download_and_parse_kospi():
    print(f"Downloading KOSPI Master to {BASE_DIR}...")
    
    # SSL Context
    ssl._create_default_https_context = ssl._create_unverified_context

    # Download
    zip_path = os.path.join(BASE_DIR, "kospi_code.zip")
    urllib.request.urlretrieve("https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip", zip_path)

    # Extract
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(BASE_DIR)
    
    mst_path = os.path.join(BASE_DIR, "kospi_code.mst")
    
    print("Parsing MST file...")
    stocks = []
    
    # Parsing Logic (Based on Reference)
    with open(mst_path, mode="r", encoding="cp949") as f:
        for row in f:
            # 1. Split Row
            # Part 1: Front (Code, Name) - Variable length due to Korean Chars? 
            # Reference script separates by slicing from end via row[0:len(row)-228]
            # Let's trust the reference logic.
            
            part2_len = 228
            part1 = row[:-part2_len]
            part2 = row[-part2_len:]
            
            # Part 1 breakdown
            # standard_code = part1[0:9] # but reference says rf1_1 (Short?)
            # The reference logic:
            # rf1_1 = rf1[0:9] (Short Code)
            # rf1_2 = rf1[9:21] (Standard Code)
            # rf1_3 = rf1[21:] (Name)
            
            short_code = part1[0:9].strip()
            standard_code = part1[9:21].strip()
            name = part1[21:].strip()
            
            # We only need stocks. Reference filters by 'KRX증권' == 'Y'?
            # Let's parse Part 2 carefully if we need filters.
            # Part 2 specs:
            # Group Code (2), Market Cap Scale (1), Sector L(4), M(4), S(4)...
            # ...
            # KRX Securities (Index 27? In Reference Column List 'KRX증권' is at some index)
            # Using Reference field_specs is complex to map manually without pandas fwf.
            # However, simpler heuristic:
            # If standard_code starts with 'KR7' (Common Stock) or similar?
            # Or just save all and filter in frontend.
            # Let's save all for now to be safe, but minimal fields.
            
            # Additional: We might want the 'Group Code' or 'Sector'.
            # Group Code is first 2 chars of Part 2.
            group_code = part2[0:2]
            
            stocks.append({
                "symbol": short_code,
                "name": name,
                "standard_code": standard_code,
                "group_code": group_code
            })

    # Cleanup
    if os.path.exists(zip_path): os.remove(zip_path)
    if os.path.exists(mst_path): os.remove(mst_path)
    
    # Remove temporary files from reference logic if they exist (part1.tmp etc)
    # Our logic didn't create them.

    # Filter invalid
    # Some rows might be empty or malformed
    stocks = [s for s in stocks if s['symbol'] and s['name']]

    print(f"Total Stocks Parsed: {len(stocks)}")
    
    # Save JSON
    json_path = os.path.join(DATA_DIR, "kospi_master.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(stocks, f, ensure_ascii=False, indent=2)
        
    print(f"Saved to {json_path}")

if __name__ == "__main__":
    download_and_parse_kospi()
