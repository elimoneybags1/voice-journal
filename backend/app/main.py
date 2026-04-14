from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import entries, folders, insights, profiles, recordings, search

app = FastAPI(title="Voice Journal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recordings.router, prefix="/recordings", tags=["recordings"])
app.include_router(entries.router, prefix="/entries", tags=["entries"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])
app.include_router(folders.router, prefix="/folders", tags=["folders"])
app.include_router(profiles.router, prefix="/profiles", tags=["profiles"])


@app.get("/health")
async def health():
    return {"status": "ok"}
