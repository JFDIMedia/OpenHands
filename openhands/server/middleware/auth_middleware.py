from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, RedirectResponse
from typing import List, Callable, Optional
import re

from openhands.server.routes.auth import get_current_user


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        public_paths: List[str] = None,
        public_path_regexes: List[str] = None,
        auth_path: str = "/login",
    ):
        super().__init__(app)
        self.public_paths = public_paths or []
        self.public_path_regexes = [re.compile(pattern) for pattern in (public_path_regexes or [])]
        self.auth_path = auth_path

    async def dispatch(self, request: Request, call_next: Callable):
        # Check if the path is public
        path = request.url.path
        
        # Always allow access to static files, API endpoints for login/auth status, and health check
        if (
            path.startswith("/static")
            or path == "/api/login"
            or path == "/api/auth-status"
            or path == "/api/logout"
            or path == "/health"
            or path == "/login"
            or path in self.public_paths
            or any(pattern.match(path) for pattern in self.public_path_regexes)
        ):
            return await call_next(request)

        # For API requests, return 401 if not authenticated
        if path.startswith("/api"):
            user = get_current_user(request)
            if not user:
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Not authenticated"},
                )
            return await call_next(request)
            
        # For non-API requests (UI routes), redirect to login page if not authenticated
        user = get_current_user(request)
        if not user and path != "/login":
            return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)
            
        return await call_next(request)