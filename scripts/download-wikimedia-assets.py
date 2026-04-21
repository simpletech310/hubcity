import urllib.request
import os

images = {
    "gateway-town-center.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Gateway_Town_Center.jpg/800px-Gateway_Town_Center.jpg",
    "heritage-house.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Heritage_House_%28Compton%2C_California%29.jpg/800px-Heritage_House_%28Compton%2C_California%29.jpg",
    "mlk-memorial.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Compton_martin_luther_king_monument.jpg/800px-Compton_martin_luther_king_monument.jpg",
    "compton-airport.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/COMPTON_AIRPORT_2.jpg/800px-COMPTON_AIRPORT_2.jpg",
    "metro-compton-station.jpg": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/HSY-_Los_Angeles_Metro%2C_Compton%2C_Platform_View.jpg/800px-HSY-_Los_Angeles_Metro%2C_Compton%2C_Platform_View.jpg"
}

os.makedirs("public/images/platform", exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

for name, url in images.items():
    path = f"public/images/platform/{name}"
    print(f"Downloading {url} to {path}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"  Done.")
    except Exception as e:
        print(f"  Failed: {e}")
