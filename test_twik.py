import asyncio
from twikit import Client
import os
from dotenv import load_dotenv
load_dotenv()

async def main():
    username = os.getenv("X_USERNAME")
    email = os.getenv("X_EMAIL")
    password = os.getenv("X_PASSWORD")
    print(username, email, password)
    client = Client('en-US')
    await client.login(auth_info_1=username, auth_info_2=email, password=password)
    tweets = await client.search_tweet("#AI", 'Latest', count=5)
    for t in tweets:
        print(t.text)

asyncio.run(main())
