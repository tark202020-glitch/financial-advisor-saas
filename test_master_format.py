import urllib.request
import ssl
import zipfile
import os

ssl._create_default_https_context = ssl._create_unverified_context

urls = {
    "kosdaq": "https://new.real.download.dws.co.kr/common/master/kosdaq_code.mst.zip",
    "nasdaq": "https://new.real.download.dws.co.kr/common/master/nasdaq_code.mst.zip",
    "nyse": "https://new.real.download.dws.co.kr/common/master/nyse_code.mst.zip",
    "amex": "https://new.real.download.dws.co.kr/common/master/amex_code.mst.zip"
}

for name, url in urls.items():
    print(f"\n--- {name} ---")
    zip_path = f"{name}.zip"
    try:
        urllib.request.urlretrieve(url, zip_path)
        with zipfile.ZipFile(zip_path, 'r') as z:
            mst_name = z.namelist()[0]
            z.extract(mst_name, ".")
            with open(mst_name, "r", encoding="cp949", errors="replace") as f:
                print("Line 1:", f.readline().strip())
                print("Line 2:", f.readline().strip())
        os.remove(zip_path)
        os.remove(mst_name)
    except Exception as e:
        print("Error:", e)
