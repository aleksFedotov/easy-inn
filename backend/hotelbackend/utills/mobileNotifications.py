import httpx
import asyncio
import threading
import logging

from asgiref.sync import sync_to_async 

logger = logging.getLogger(__name__)


async def send_expo_push_notification(token: str, title: str, body: str, data: dict = None):
    """
    Sends a notification via Expo Push Service using httpx.
    This method is async.
    """
    if not token.startswith("ExponentPushToken"):
        logger.warning(f"Attempted to send notification to non-Expo token: {token[:20]}...")
        return

    payload = {
        "to": token,
        "title": title,
        "body": body,
        "data": data or {},
        "sound": "default", # Or specify a custom sound
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("https://exp.host/--/api/v2/push/send", json=payload)
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
            result = response.json()
            logger.info(f"Expo push sent successfully to {token[:20]}...: {result}")

            if result.get('data') and result['data'].get('status') == 'error':
                logger.error(f"Error sending Expo push to {token[:20]}...: {result['data'].get('message')}")
            return result
    except httpx.TimeoutException:
        logger.error(f"Expo push timeout for token {token[:20]}...")
    except httpx.HTTPStatusError as e:
        logger.error(f"Expo push HTTP error {e.response.status_code} for token {token[:20]}...: {e.response.text}", exc_info=True)
    except Exception as e:
        logger.error(f"Expo push failed for token {token[:20]}...: {e}", exc_info=True)


def send_notifications_in_thread(tokens_to_send: list, title: str, body: str, data: dict = None):
    """
    Sends notifications to multiple tokens concurrently using asyncio.gather
    and runs it in a separate thread to avoid blocking the main request.
    """
    async def _send_all_expo_pushes():
        tasks = [
            send_expo_push_notification( 
                token=token,
                title=title, 
                body=body,    
                data=data     #
            )
            for token in tokens_to_send
        ]
        await asyncio.gather(*tasks)

    thread = threading.Thread(target=lambda: asyncio.run(_send_all_expo_pushes()))
    thread.start()
