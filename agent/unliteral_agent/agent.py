import os
import requests
from dotenv import load_dotenv
from google import genai
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini

load_dotenv()

PARALLEL_SEARCH_URL = os.getenv(
    "PARALLEL_SEARCH_URL",
    "https://unliteral.vercel.app/api/parallel/search",
)

EXPRESS_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")

if not EXPRESS_API_KEY:
    raise RuntimeError("GOOGLE_GENAI_API_KEY is missing")


# Google Express Mode client
express_client = genai.Client(
    vertexai=True,
    api_key=EXPRESS_API_KEY,
)

# ADK Gemini model using the Express Mode client
express_gemini = Gemini(
    model="gemini-3.5-flash",
    client=express_client,
)


def research_cultural_context(
    text: str,
    language: str = "English",
) -> dict:
    """Research cultural context using UNLITERAL's Parallel integration."""

    try:
        response = requests.post(
            PARALLEL_SEARCH_URL,
            json={
                "query": text,
                "language": language,
            },
            timeout=30,
        )

        if not response.ok:
            return {
                "status": "error",
                "message": f"Parallel research failed: HTTP {response.status_code}",
            }

        return {
            "status": "success",
            "research": response.json(),
        }

    except Exception as error:
        return {
            "status": "error",
            "message": str(error),
        }


root_agent = Agent(
    name="unliteral_cultural_localization_agent",
    model=express_gemini,
    description=(
        "UNLITERAL's AI agent for culturally accurate localization "
        "of dialogue, slang, idioms, regional expressions and references."
    ),
    instruction="""
You are UNLITERAL's cultural localization agent.

Your job is to translate and localize dialogue while preserving
the original meaning, emotion, tone, humor and cultural intent.

You are NOT a literal translation engine.

When the input contains:
- slang
- idioms
- regional expressions
- cultural references
- Indian expressions
- jokes
- wordplay
- references that require cultural knowledge

use the research_cultural_context tool before producing the final answer.

Use research selectively. Do not call it unnecessarily for simple
sentences that do not contain cultural context.

When research is available:
1. Understand the cultural meaning.
2. Preserve the speaker's intent.
3. Adapt the expression naturally for the target language/culture.
4. Never invent cultural facts.
5. Do not unnecessarily change names, places or important story details.

Return a concise structured result containing:

Original:
The original dialogue.

Localized:
The natural localized version.

CulturalContext:
A short explanation of any cultural adaptation.

Reason:
Why the localization works better than a literal translation.

Always prioritize natural dialogue over word-for-word translation.
""",
    tools=[research_cultural_context],
)