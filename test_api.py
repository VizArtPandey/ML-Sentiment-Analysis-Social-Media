import requests
res = requests.get("http://127.0.0.1:8000/api/live-eval?hashtag=india&n=1")
print(res.status_code)
if res.status_code != 200:
    print(res.text)
else:
    print("Success")
