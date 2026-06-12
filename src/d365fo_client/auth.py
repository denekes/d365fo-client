"""Authentication utilities for D365 F&O client."""

import asyncio
from datetime import datetime
from typing import Optional, Union

from azure.identity import ClientSecretCredential, DefaultAzureCredential

from .credential_sources import CredentialManager
from .exceptions import AuthenticationError
from .models import FOClientConfig


class AuthenticationManager:
    """Manages authentication for F&O client"""

    def __init__(self, config: FOClientConfig):
        """Initialize authentication manager

        Args:
            config: F&O client configuration
        """
        self.config = config
        self._token = None
        self._token_expires = None
        self._credential_manager = CredentialManager()
        self.credential: Optional[
            Union[ClientSecretCredential, DefaultAzureCredential]
        ] = None  # Will be set by _setup_credentials

    async def _setup_credentials(self):
        """Setup authentication credentials with support for credential sources"""

        # Check if credential source is specified in config
        credential_source = self.config.credential_source

        if credential_source is not None:
            # Use credential source to get credentials
            try:
                client_id, client_secret, tenant_id = (
                    await self._credential_manager.get_credentials(credential_source)
                )
                self.credential = ClientSecretCredential(
                    tenant_id=tenant_id,
                    client_id=client_id,
                    client_secret=client_secret,
                )
                return
            except Exception as e:
                raise AuthenticationError(
                    f"Failed to setup credentials from source: {e}"
                ) from e

        # Fallback to existing logic for backward compatibility

        self.credential = DefaultAzureCredential()

    async def get_token(self) -> str:
        """Get authentication token

        Returns:
            Bearer token string
        """
        # Skip authentication for localhost/mock server
        if self._is_localhost():
            return "mock-token-for-localhost"

        # Initialize credentials if not already set
        if self.credential is None:
            await self._setup_credentials()

        if self.credential is None:
            raise AuthenticationError("Authentication credentials are not set up.")

        if (
            self._token
            and self._token_expires
            and datetime.now().timestamp() < self._token_expires
        ):
            return self._token

        scope = f"{self.config.base_url.rstrip('/')}/.default"
        try:
            # azure.identity credentials are synchronous; run the token request
            # in a worker thread so it doesn't block the event loop.
            token = await asyncio.to_thread(self.credential.get_token, scope)
        except Exception as e:
            raise AuthenticationError(
                f"Failed to get authentication token for scope {scope}: {e}"
            ) from e

        self._token = token.token
        self._token_expires = token.expires_on
        return self._token

    def _is_localhost(self) -> bool:
        """Check if the base URL is localhost (for mock testing)

        Returns:
            True if base URL is localhost/127.0.0.1
        """
        base_url = self.config.base_url.lower()
        return any(host in base_url for host in ["localhost", "127.0.0.1", "::1"])

    def invalidate_token(self):
        """Invalidate cached token to force refresh"""
        self._token = None
        self._token_expires = None

    async def invalidate_credentials(self):
        """Invalidate cached credentials and token to force full refresh"""
        self.invalidate_token()
        self.credential = None
        if hasattr(self, "_credential_manager"):
            self._credential_manager.clear_cache()

    def get_credential_cache_stats(self) -> dict:
        """Get credential cache statistics for debugging"""
        if hasattr(self, "_credential_manager"):
            return self._credential_manager.get_cache_stats()
        return {"total_cached": 0, "expired": 0, "active": 0}
