import asyncio
from twikit import Client

async def main():
    client = Client('en-US')
    tweets = await client.search_tweet('python', 'Latest')
    print(tweets)

asyncio.run(main())
