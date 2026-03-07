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

# SSL Context
ssl._create_default_https_context = ssl._create_unverified_context

def download_and_extract(url, zip_name):
    zip_path = os.path.join(BASE_DIR, zip_name)
    print(f"Downloading {url}...")
    urllib.request.urlretrieve(url, zip_path)
    
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(BASE_DIR)
        mst_files = [f for f in z.namelist() if f.endswith('.mst') or f.endswith('.mac')]
    
    os.remove(zip_path)
    return [os.path.join(BASE_DIR, f) for f in mst_files]

def parse_domestic(mst_path, market_type):
    stocks = []
    print(f"Parsing Domestic MST: {mst_path}")
    with open(mst_path, mode="r", encoding="cp949", errors="replace") as f:
        for row in f:
            part2_len = 228
            if len(row) <= part2_len: continue
            part1 = row[:-part2_len]
            part2 = row[-part2_len:]
            
            short_code = part1[0:9].strip()
            standard_code = part1[9:21].strip()
            name = part1[21:].strip()
            group_code = part2[0:2]
            
            if short_code and name:
                stocks.append({
                    "symbol": short_code,
                    "name": name,
                    "market": market_type,
                    "standard_code": standard_code
                })
    return stocks

def parse_overseas(mst_path, market_type):
    stocks = []
    print(f"Parsing Overseas MST: {mst_path}")
    with open(mst_path, mode="r", encoding="cp949", errors="replace") as f:
        for row in f:
            # Overseas files are typically separated by pipe | or tab
            delimiter = '|' if '|' in row else '\t'
            cols = [c.strip() for c in row.split(delimiter)]
            
            if len(cols) >= 5:
                # Based on typical KIS overseas master layout
                # Try to adapt to standard if cols[3] is symbol, cols[6] is eng name, cols[5] is kor name
                # If structure is slightly different, fallback to basic lengths
                symbol = cols[3] if len(cols) > 3 else cols[0]
                # Filter out header or invalid rows
                if symbol.lower() == 'symbol' or not symbol: continue
                
                name_kor = cols[5] if len(cols) > 5 else ''
                name_eng = cols[6] if len(cols) > 6 else cols[4] if len(cols) > 4 else ''
                
                name = name_kor if name_kor else name_eng
                if not name: name = symbol
                
                stocks.append({
                    "symbol": symbol,
                    "name": name,
                    "market": "US",
                    "exchange": market_type
                })
    return stocks

def generate_all_masters():
    all_stocks = []
    
    # 1. KOSPI
    mst_files = download_and_extract("https://new.real.download.dws.co.kr/common/master/kospi_code.mst.zip", "kospi_code.zip")
    for mst in mst_files:
        all_stocks.extend(parse_domestic(mst, "KR"))
        os.remove(mst)
        
    # 2. KOSDAQ
    mst_files = download_and_extract("https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip", "kosdaq_code.zip")
    for mst in mst_files:
        all_stocks.extend(parse_domestic(mst, "KR"))
        os.remove(mst)

    # 3. NASDAQ
    mst_files = download_and_extract("https://new.real.download.dws.co.kr/common/master/nasdaq_code.mst.zip", "nasdaq_code.zip")
    for mst in mst_files:
        all_stocks.extend(parse_overseas(mst, "NASDAQ"))
        os.remove(mst)

    # 4. NYSE
    mst_files = download_and_extract("https://new.real.download.dws.co.kr/common/master/nyse_code.mst.zip", "nyse_code.zip")
    for mst in mst_files:
        all_stocks.extend(parse_overseas(mst, "NYSE"))
        os.remove(mst)

    # 5. AMEX
    mst_files = download_and_extract("https://new.real.download.dws.co.kr/common/master/amex_code.mst.zip", "amex_code.zip")
    for mst in mst_files:
        all_stocks.extend(parse_overseas(mst, "AMEX"))
        os.remove(mst)

    # Save to single unified JSON or split
    # For scalable search, saving all to one `all_stocks_master.json`
    output_path = os.path.join(DATA_DIR, "all_stocks_master.json")
    print(f"Total stocks parsed: {len(all_stocks)}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_stocks, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved all master data to {output_path}")

if __name__ == "__main__":
    generate_all_masters()
