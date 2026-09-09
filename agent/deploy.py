import os

import vertexai
from vertexai import types
from vertexai.agent_engines import AdkApp

from unliteral_agent.agent import root_agent


PROJECT_ID = os.environ["GOOGLE_CLOUD_PROJECT"]
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
STAGING_BUCKET = os.environ["STAGING_BUCKET"]


def main():
    client = vertexai.Client(
        project=PROJECT_ID,
        location=LOCATION,
    )

    app = AdkApp(
        agent=root_agent,
    )

    remote_agent = client.agent_engines.create(
        agent=app,
        config={
            "display_name": "UNLITERAL Cultural Localization Agent",
            "description": (
                "Google ADK agent powering UNLITERAL cultural localization "
                "with Gemini and Parallel research."
            ),
            "requirements": [
                "google-cloud-aiplatform[agent_engines,adk]",
                "google-adk",
                "requests",
            ],
            "staging_bucket": STAGING_BUCKET,
            "identity_type": types.IdentityType.AGENT_IDENTITY,
            "env_vars": {
                "PARALLEL_SEARCH_URL": (
                    "https://unliteral.vercel.app/api/parallel/search"
                ),
            },
        },
    )

    print("UNLITERAL ADK agent deployed successfully.")
    print("Resource name:")
    print(remote_agent.api_resource.name)


if __name__ == "__main__":
    main()
