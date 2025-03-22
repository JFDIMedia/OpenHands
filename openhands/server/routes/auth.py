from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
import secrets
import os
from typing import Optional

app = APIRouter(prefix="/api", tags=["auth"])
security = HTTPBasic()

# In a real application, you would use a proper database and hashed passwords
# For this simple example, we'll use environment variables or hardcoded defaults
DEFAULT_USERNAME = os.environ.get("AUTH_USERNAME", "admin")
DEFAULT_PASSWORD = os.environ.get("AUTH_PASSWORD", "password")

# Store for active sessions
active_sessions = {}


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    session_id: str
    username: str


class AuthStatus(BaseModel):
    authenticated: bool
    username: Optional[str] = None


def get_current_user(request: Request) -> Optional[str]:
    """Get the current user from the session cookie."""
    session_id = request.cookies.get("session_id")
    if session_id and session_id in active_sessions:
        return active_sessions[session_id]
    return None


@app.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest, response: Response):
    """Login endpoint that returns a session cookie."""
    if login_data.username == DEFAULT_USERNAME and login_data.password == DEFAULT_PASSWORD:
        # Generate a random session ID
        session_id = secrets.token_hex(16)
        active_sessions[session_id] = login_data.username
        
        # Set the session cookie
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            max_age=3600,  # 1 hour
            samesite="lax",
            secure=False,  # Set to True in production with HTTPS
        )
        
        return LoginResponse(session_id=session_id, username=login_data.username)
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password",
        headers={"WWW-Authenticate": "Basic"},
    )


@app.post("/logout")
async def logout(response: Response, request: Request):
    """Logout endpoint that clears the session cookie."""
    session_id = request.cookies.get("session_id")
    if session_id and session_id in active_sessions:
        del active_sessions[session_id]
    
    response.delete_cookie(key="session_id")
    return {"message": "Logged out successfully"}


@app.get("/auth-status", response_model=AuthStatus)
async def auth_status(request: Request):
    """Check if the user is authenticated."""
    username = get_current_user(request)
    if username:
        return AuthStatus(authenticated=True, username=username)
    return AuthStatus(authenticated=False)