import requests
import time
import sys

def main():
    print("Checking if API is up and all models are loaded...")
    for _ in range(40):
        try:
            res = requests.get("http://127.0.0.1:8000/api/health", timeout=2)
            if res.status_code == 200:
                data = res.json()
                models = data.get("models_loaded", {})
                print(f"Current models status: {models}")
                if all(models.values()):
                    print("SUCCESS: All models (including BiLSTM) are fully loaded and online!")
                    sys.exit(0)
                else:
                    print("Waiting for all models to load...")
        except requests.ConnectionError:
            print("API offline, waiting...")
        time.sleep(2)
        
    print("FAIL: Models did not load in time or API is inaccessible.")
    sys.exit(1)

if __name__ == "__main__":
    main()
