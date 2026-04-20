import requests
import time
import os
import signal
from subprocess import Popen

# kill existing uvicorn to force reload
os.system("pkill -9 -f 'uvicorn.*backend.main:app'")
time.sleep(1)
