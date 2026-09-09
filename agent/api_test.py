import os

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from unliteral_agent.agent import root_agent


APP_NAME = "unliteral"
USER_ID = "unliteral-user"


async def run_agent(text: str, language: str = "English") -> str:
    """
    Run the UNLITERAL Google ADK localization agent.

    Args:
        text: Dialogue to localize.
        language: Target language.

    Returns:
        Agent response as text.
    """

    session_service = InMemorySessionService()

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
    )

    runner = Runner(
        agent=root_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    prompt = f"""
Localize the following dialogue into {language}.

Dialogue:
{text}

Preserve the emotion, intent, cultural meaning and natural
spoken style. Do not perform a literal word-for-word translation.
"""

    content = types.Content(
        role="user",
        parts=[types.Part(text=prompt)],
    )

    final_response = ""

    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=session.id,
        new_message=content,
    ):
        if event.is_final_response() and event.content:
            for part in event.content.parts:
                if part.text:
                    final_response += part.text

    return final_response
