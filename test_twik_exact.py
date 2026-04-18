import asyncio
from twikit import Client
import os
from dotenv import load_dotenv

load_dotenv()

async def fetch_tweets():
    username = os.getenv("X_USERNAME")
    email = os.getenv("X_EMAIL")
    password = os.getenv("X_PASSWORD")
    
    print(f"Testing with: {username} | {email} | {password}")
    client = Client('en-US')
    
    print("Attempting to login via twikit...")
    try:
        await client.login(auth_info_1=username, auth_info_2=email, password=password)
        print("Login successful! Searching tweets...")
        
        tweets = await client.search_tweet('python', 'Latest', count=5)
        for tweet in tweets:
            print(
                "USER:", tweet.user.name,
                "| TEXT:", tweet.text,
                "| AT:", tweet.created_at
            )
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(fetch_tweets())
