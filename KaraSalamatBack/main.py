import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette import status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import authentication
from database import init_db
from sqlalchemy import text


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(authentication.router)


@app.get("/test_connection", status_code=status.HTTP_200_OK)
def test_connection():
    from database import SessionLocal
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ok", "db_status": "connected"}
    except Exception as e:
        return {"status": "error", "db_status": str(e)}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
