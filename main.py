import os
import json
import asyncio
import time
import copy
from pathlib import Path
from typing import Dict, List, Any, Optional, Awaitable, Tuple

# The decky plugin module is located at decky-loader/plugin
import decky

# Import our Rust backend components
from vn_core import (
    HikariClient,
    DlsiteClient,
    DlsiteProduct,
    DownloadManager,
    GameLibrary,
    SortBy,
    PerformanceManager,
    SteamIntegration,
)

class Plugin:
    async def _main(self):
        """Initialize the plugin"""
        decky.logger.info("Visual Novel Manager plugin starting...")
        self._start_time = time.time()

        # Initialize directories using Decky environment variables
        self.settings_dir = Path(decky.DECKY_PLUGIN_SETTINGS_DIR)
        self.runtime_dir = Path(decky.DECKY_PLUGIN_RUNTIME_DIR)
        self.log_dir = Path(decky.DECKY_PLUGIN_LOG_DIR)

        # Create game directory in runtime (for downloads and game files)
        self.games_dir = self.runtime_dir / "games"
        self.games_dir.mkdir(parents=True, exist_ok=True)

        self.proton_dir = self.games_dir / "proton_environments"
        self.proton_dir.mkdir(parents=True, exist_ok=True)

        # Initialize synchronization and caching primitives
        self._settings_lock = asyncio.Lock()
        self._save_debounce_task: Optional[asyncio.Task] = None
        self._save_debounce_delay_sec: float = 0.5

        # Library cache TTL (delegated to Rust where possible)
        self._cache_ttl_sec: float = 45.0

        # Initialize preference defaults
        self._default_preferences = self._load_default_preferences()
        self.preferences = dict(self._default_preferences)

        # Initialize Rust backend modules
        self.hikari_api = HikariClient()
        self.dlsite_api = DlsiteClient()
        self.download_manager = DownloadManager(str(self.games_dir))
        self.steam_integration = SteamIntegration(str(self.games_dir))
        self.game_library = GameLibrary(str(self.games_dir))

        # Load settings
        await self._load_settings()

        # Initialize performance manager
        self.performance_manager = PerformanceManager()
        await self.performance_manager.initialize()

        # Initialize modules
        await self.hikari_api.initialize()
        await self.dlsite_api.initialize()
        # Download manager initialization handled in Rust


        decky.logger.info("Visual Novel Manager plugin loaded successfully!")

    async def _unload(self):
        """Clean up when plugin is unloaded"""
        decky.logger.info("Visual Novel Manager plugin unloading...")

        # Save settings
        await self._save_settings()

        # Clean up modules with timeouts to avoid hanging the unload
        async def safe_wait(coro: Awaitable[Any], name: str):
            try:
                await asyncio.wait_for(coro, timeout=5)
            except Exception as err:
                decky.logger.warning(f"{name} cleanup error: {err}")

        await asyncio.gather(
            safe_wait(self.hikari_api.cleanup(), "Hikari"),
            safe_wait(self.dlsite_api.cleanup(), "DLsite"),
            safe_wait(self.download_manager.cleanup(), "DownloadManager"),
            return_exceptions=True,
        )

        # Clean up performance manager last
        await safe_wait(self.performance_manager.cleanup(), "PerformanceManager")

        decky.logger.info("Visual Novel Manager plugin unloaded!")

    def _uninstall(self):
        """Clean up when plugin is uninstalled"""
        decky.logger.info("Visual Novel Manager plugin uninstalling...")

    def _migration(self):
        """Handle data migration"""
        decky.logger.info("Visual Novel Manager plugin migrating...")

        # Migrate old settings if they exist
        old_settings_path = os.path.join(decky.DECKY_USER_HOME, ".config", "visual-novel-manager")
        if os.path.exists(old_settings_path):
            decky.migrate_settings(old_settings_path)

    async def _load_settings(self):
        """Load plugin settings"""
        try:
            settings_file = Path(decky.DECKY_PLUGIN_SETTINGS_DIR) / "settings.json"
            if settings_file.exists():
                async with self._settings_lock:
                    contents = await asyncio.to_thread(settings_file.read_text, encoding="utf-8")
                    settings = json.loads(contents)

                # Restore API state
                if settings.get('hikari_token') or settings.get('current_server'):
                    await self.hikari_api.import_state(
                        settings.get('hikari_token'),
                        settings.get('current_server')
                    )

                # Restore game configurations
                if settings.get('game_environments'):
                    # Steam integration handles this differently now
                    pass

                self.preferences = self._normalize_preferences(settings.get('preferences'))
            else:
                self.preferences = dict(self._default_preferences)

        except Exception as e:
            decky.logger.error(f"Failed to load settings: {e}")

    async def _save_settings(self):
        """Save plugin settings"""
        try:
            # Get Hikari state from Rust backend
            hikari_state = await self.hikari_api.export_state()
            settings = {
                'hikari_token': hikari_state.get('token'),
                'current_server': hikari_state.get('selected_cdn'),
                'steam_games': [],  # Will be handled by Steam integration if needed
                'preferences': self.preferences,
            }

            settings_file = Path(decky.DECKY_PLUGIN_SETTINGS_DIR) / "settings.json"
            settings_file.parent.mkdir(parents=True, exist_ok=True)
            tmp_file = settings_file.with_suffix('.json.tmp')

            # Serialize write with a lock and use atomic replace to prevent partial writes
            async with self._settings_lock:
                payload = json.dumps(settings, indent=2)
                await asyncio.to_thread(tmp_file.write_text, payload, encoding="utf-8")
                # Use os.replace for atomic move on POSIX
                os.replace(tmp_file, settings_file)

        except Exception as e:
            decky.logger.error(f"Failed to save settings: {e}")

    def _load_default_preferences(self) -> Dict[str, Any]:
        base_defaults: Dict[str, Any] = {
            "language": "en",
            "defaultProtonVersion": "proton_experimental",
            "autoUpdate": True,
            "downloadPath": "",
        }

        defaults_path = Path(__file__).parent / "defaults" / "settings.json"
        if defaults_path.exists():
            try:
                with defaults_path.open('r', encoding='utf-8') as handle:
                    payload = json.load(handle)
                base_defaults = self._normalize_preferences(payload, base_defaults)
            except Exception as err:
                decky.logger.warning(f"Failed to read default preferences: {err}")

        return base_defaults

    def _normalize_preferences(
        self,
        raw: Optional[Dict[str, Any]],
        template: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        reference = dict(template or getattr(self, "_default_preferences", {
            "language": "en",
            "defaultProtonVersion": "proton_experimental",
            "autoUpdate": True,
            "downloadPath": "",
        }))

        if not isinstance(raw, dict):
            return reference

        for key in reference.keys():
            value = raw.get(key)
            if key == "language":
                if isinstance(value, str):
                    reference[key] = value
            elif key == "defaultProtonVersion":
                if isinstance(value, str):
                    reference[key] = self._coerce_proton_identifier(value)
            elif key == "downloadPath":
                if isinstance(value, str):
                    reference[key] = value
            elif key == "autoUpdate":
                if isinstance(value, bool):
                    reference[key] = value

        return reference

    def _coerce_proton_identifier(self, value: str) -> str:
        mapping = {
            "experimental": "proton_experimental",
            "proton_experimental": "proton_experimental",
            "9.0": "proton_90",
            "proton_9.0": "proton_90",
            "proton_90": "proton_90",
            "8.0": "proton_80",
            "proton_8.0": "proton_80",
            "proton_80": "proton_80",
        }
        return mapping.get(value, value)

    async def get_backend_status(self) -> Dict[str, Any]:
        """Expose lightweight runtime health information."""
        started_at = getattr(self, "_start_time", None)
        uptime = 0.0
        running = started_at is not None

        if running:
            uptime = max(0.0, time.time() - started_at)

        return {
            "running": running,
            "startedAt": started_at,
            "uptimeSeconds": uptime,
        }

    async def get_user_preferences(self) -> Dict[str, Any]:
        """Return current user preferences for the frontend."""
        return dict(self.preferences)

    async def update_user_preferences(self, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Persist preference updates from the frontend."""
        if not isinstance(updates, dict):
            return dict(self.preferences)

        async with self._settings_lock:
            merged = dict(self.preferences)
            merged.update({k: updates[k] for k in updates if k in self._default_preferences})
            self.preferences = self._normalize_preferences(merged)

        self.request_save_settings()
        return dict(self.preferences)

    def request_save_settings(self, delay: Optional[float] = None) -> None:
        """Request a debounced settings save to coalesce multiple updates."""
        try:
            if self._save_debounce_task and not self._save_debounce_task.done():
                self._save_debounce_task.cancel()
        except Exception:
            pass

        delay_sec = float(self._save_debounce_delay_sec if delay is None else delay)

        async def _debounced():
            try:
                await asyncio.sleep(delay_sec)
                await self._save_settings()
            except asyncio.CancelledError:
                return
            except Exception as err:
                decky.logger.warning(f"Debounced save failed: {err}")
            finally:
                self._save_debounce_task = None

        self._save_debounce_task = asyncio.create_task(_debounced())

    def _load_game_metadata(self, game_id: str) -> Dict[str, Any]:
        """Return mutable metadata dictionary for a game."""
        try:
            metadata = self.game_library.get_game_metadata(game_id)
            if isinstance(metadata, dict):
                return metadata
        except Exception as err:
            decky.logger.warning(f"Failed to load metadata for {game_id}: {err}")
        return {}

    def _store_game_metadata(self, game_id: str, metadata: Dict[str, Any]) -> None:
        """Persist metadata back through the library."""
        try:
            saved = self.game_library.save_game_metadata(game_id, metadata)
            if not saved:
                decky.logger.warning(f"Metadata save for {game_id} returned False")
        except Exception as err:
            decky.logger.error(f"Failed to persist metadata for {game_id}: {err}")

    # Frontend API methods - Hikari Field
    async def get_login_status(self) -> Dict[str, Any]:
        """Get current login status"""
        status = await self.hikari_api.get_login_status()
        return status

    async def hikari_login(self, email: str, password: str) -> Dict[str, Any]:
        """Login to Hikari Field"""
        result = await self.hikari_api.login(email, password)
        if result["success"]:
            await self._save_settings()
        return result

    async def hikari_logout(self) -> Dict[str, bool]:
        """Logout from Hikari Field"""
        success = await self.hikari_api.logout()
        await self._save_settings()
        return {"success": success}

    async def select_hikari_cdn_server(self, server_ip: str) -> Dict[str, bool]:
        """Select Hikari Field CDN server for downloads"""
        result = await self.hikari_api.select_cdn(server_ip)
        success = result.get("success", False)
        if success:
            self.request_save_settings()
        return {"success": success}

    async def get_hikari_game_list(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Get game library with local status"""
        # If not logged in, return empty list
        if not self.hikari_api.is_logged_in():
            return []

        # Let Rust-side cache handle reuse unless force_refresh is True
        library_result = await self.hikari_api.fetch_library(force_refresh)
        base_apps = library_result.get("apps", [])

        games = copy.deepcopy(base_apps)

        # Enrich list in Rust for installed/downloading/progress
        try:
            enriched = self.game_library.enrich_games(games, self.download_manager)
            # Update library cache for later metadata lookups
            self.game_library.update_library_cache(enriched)
            return enriched
        except Exception as err:
            decky.logger.warning(f"enrich_games failed, falling back: {err}")
            # Fallback to raw list
            return games

    async def check_game_updates(self) -> List[Dict[str, Any]]:
        """Check for game updates using incremental API"""
        if not self.hikari_api.is_logged_in():
            return []

        # For now, return empty list as update checking will be handled differently in Rust
        # TODO: Implement update checking in Rust backend
        return []

    # DLsite API methods
    async def dlsite_login(self, username: str, password: str) -> Dict[str, Any]:
        """Login to DLsite"""
        result = await self.dlsite_api.login(username, password)
        if result["success"]:
            await self._save_settings()
        return result

    async def dlsite_logout(self) -> Dict[str, bool]:
        """Logout from DLsite"""
        success = await self.dlsite_api.logout()
        await self._save_settings()
        return {"success": success}

    async def get_dlsite_login_status(self) -> Dict[str, bool]:
        """Get DLsite login status"""
        try:
            is_logged_in = await self.dlsite_api.is_logged_in()
        except Exception as err:
            decky.logger.error(f"Failed to read DLsite login status: {err}")
            is_logged_in = False
        return {"isLoggedIn": bool(is_logged_in)}

    async def get_dlsite_game_list(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Get DLsite library"""
        # Validate login; avoid serving stale cache when not logged in
        try:
            if not await self.dlsite_api.is_logged_in():
                return []
        except Exception:
            # On error, fall through to try cache; otherwise empty list
            pass

        # Use Rust-side cached accessor with TTL and optional force
        dlsite_products = await self.dlsite_api.get_library_cached(force_refresh, int(self._cache_ttl_sec))

        games: List[Dict[str, Any]] = []
        for product in dlsite_products:
            games.append({
                "id": product.id,
                "name": product.title,
                "developer": product.group_name,
                "description": product.description,
                "thumbnail": product.thumbnail,
                "tags": product.tags,
                "size": self.format_file_size(product.file_size),
                "expected_size": product.file_size,
                "price": product.price,
                "age_rating": product.age_category,
                "work_type": product.work_type,
                "release_date": product.release_date,
                "platform": "dlsite",
            })

        try:
            enriched = self.game_library.enrich_games(games, self.download_manager)
            self.game_library.update_library_cache(enriched)
            return enriched
        except Exception as err:
            decky.logger.warning(f"enrich_games failed: {err}")
            return games

    async def download_dlsite_game(self, game_id: str) -> Dict[str, Any]:
        """Download a game from DLsite"""
        # Get download URLs (supports multi-part downloads)
        download_urls = await self.dlsite_api.get_download_urls(game_id)
        if not download_urls:
            return {"success": False, "message": "Failed to get download URLs"}

        # Get game info for display name
        dlsite_products = await self.dlsite_api.get_library()
        product_info = next((p for p in dlsite_products if p.id == game_id), None)
        game_name = product_info.title if product_info else f"DLsite Product {game_id}"

        # Start download with multiple URLs if needed (DLsite supports multi-part)
        url_list = [url for url in download_urls if isinstance(url, str)]
        if not url_list:
            return {"success": False, "message": "No valid download URLs returned"}

        return await self.download_manager.start_download(
            game_id,
            game_name,
            url_list,
            product_info.file_size if product_info else None,
            ""  # DLsite doesn't provide hashes typically
        )

    async def search_dlsite_games(self, query: str, category: str = "all") -> List[Dict[str, Any]]:
        """Search for games on DLsite"""
        search_results = await self.dlsite_api.search_products(query, category)

        # Convert to common format
        games = []
        for product in search_results:
            games.append({
                "id": product.id,
                "name": product.title,
                "developer": product.group_name,
                "description": product.description,
                "thumbnail": product.thumbnail,
                "tags": product.tags,
                "size": self.format_file_size(product.file_size),
                "expected_size": product.file_size,
                "price": product.price,
                "age_rating": product.age_category,
                "work_type": product.work_type,
                "release_date": product.release_date,
                "platform": "dlsite"
            })

        return games

    def format_file_size(self, size_bytes: int) -> str:
        """Format file size in bytes to human readable format"""
        if size_bytes == 0:
            return "0B"

        size_names = ["B", "KB", "MB", "GB", "TB"]
        import math
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 1)

        return f"{s}{size_names[i]}"

    # Frontend API methods - Downloads
    async def download_hikari_game(self, game_id: str) -> Dict[str, Any]:
        """Start downloading a game with multi-source support using official API"""

        # Get signed download URLs
        download_result = await self.hikari_api.get_signed_urls(game_id, 0)
        download_urls = download_result.get("result", [])
        if not download_urls:
            return {"success": False, "message": "Failed to get download URLs"}

        # Extract URLs from the result
        urls = []
        if isinstance(download_urls, list):
            urls = [url for url in download_urls if isinstance(url, str)]
        elif isinstance(download_urls, dict) and "urls" in download_urls:
            urls = download_urls["urls"]

        if not urls:
            return {"success": False, "message": "No download URLs found"}

        # Get game info for display name and metadata (guard None)
        game_info = self.game_library.get_cached_game_info(game_id)
        game_name = game_info.get("name", f"Game {game_id}") if isinstance(game_info, dict) else f"Game {game_id}"
        expected_size = game_info.get("expected_size") if isinstance(game_info, dict) else None
        integrity_hash = game_info.get("integrity_hash") if isinstance(game_info, dict) else None

        # Start multi-source download
        return await self.download_manager.start_download(
            game_id,
            game_name,
            urls,
            expected_size,
            integrity_hash,
        )

    async def pause_download(self, game_id: str) -> Dict[str, bool]:
        """Pause a download"""
        result = await self.download_manager.pause_download(game_id)
        return {"success": result.get("success", False)}

    async def resume_download(self, game_id: str) -> Dict[str, bool]:
        """Resume a download"""
        result = await self.download_manager.resume_download(game_id)
        return {"success": result.get("success", False)}

    async def cancel_download(self, game_id: str) -> Dict[str, bool]:
        """Cancel a download"""
        result = await self.download_manager.cancel_download(game_id)
        return {"success": result.get("success", False)}

    async def get_active_downloads(self) -> List[Dict[str, Any]]:
        """Get list of active downloads"""
        return self.download_manager.get_active_downloads()


    # Frontend API methods - Steam Integration
    async def get_proton_versions(self) -> List[Dict[str, Any]]:
        """Get available Proton/compatibility versions"""
        return await self.steam_integration.get_available_proton_versions()

    async def add_game_to_steam(self, game_id: str, compatibility_tool: str = "proton_experimental") -> Dict[str, Any]:
        """Add a downloaded game to Steam library"""
        # Get game info
        game_info = self.game_library.get_cached_game_info(game_id)
        if not game_info:
            return {"success": False, "message": "Game not found"}

        # Get game executable
        game_exe = self.game_library.get_game_executable(game_id)
        if not game_exe:
            return {"success": False, "message": "Game executable not found"}

        game_dir = str(self.games_dir / f"game_{game_id}")
        game_name = game_info.get("name", f"Game {game_id}")

        result = await self.steam_integration.add_game_to_steam(
            game_id, game_name, str(game_exe), game_dir, compatibility_tool
        )

        if result["success"]:
            app_id = result.get("app_id")
            metadata = self._load_game_metadata(game_id)
            if app_id:
                metadata["steamAppId"] = app_id
            metadata["steamCompatibilityTool"] = compatibility_tool
            metadata["steamAddedAt"] = time.time()
            self._store_game_metadata(game_id, metadata)
            self.request_save_settings()

        return result

    async def remove_game_from_steam(self, app_id: str) -> Dict[str, Any]:
        """Remove a game from Steam library"""
        result = await self.steam_integration.remove_game_from_steam(app_id)
        if result["success"]:
            try:
                installed_games = self.game_library.get_installed_games()
            except Exception as err:
                decky.logger.error(f"Failed to enumerate installed games for metadata cleanup: {err}")
                installed_games = []

            for installed_id in installed_games:
                metadata = self._load_game_metadata(installed_id)
                if metadata.get("steamAppId") == app_id:
                    metadata.pop("steamAppId", None)
                    metadata.pop("steamCompatibilityTool", None)
                    metadata.pop("steamComponents", None)
                    metadata.pop("steamLocale", None)
                    metadata.pop("steamAddedAt", None)
                    self._store_game_metadata(installed_id, metadata)
                    break
            self.request_save_settings()
        return result

    async def configure_wine_components(self, app_id: str, components: List[str],
                                      locale: Optional[str] = None) -> Dict[str, Any]:
        """Configure Wine components and locale for a Steam game"""
        result = await self.steam_integration.configure_winetricks(app_id, components, locale)
        if result.get("success"):
            try:
                installed_games = self.game_library.get_installed_games()
            except Exception as err:
                decky.logger.error(f"Failed to enumerate installed games for Wine metadata: {err}")
                installed_games = []

            for installed_id in installed_games:
                metadata = self._load_game_metadata(installed_id)
                if metadata.get("steamAppId") == app_id:
                    if components is not None:
                        metadata["steamComponents"] = list(components)
                    if locale is not None:
                        metadata["steamLocale"] = locale
                    self._store_game_metadata(installed_id, metadata)
                    break
        return result

    async def get_steam_game_info(self, game_id: str) -> Optional[Dict[str, Any]]:
        """Get Steam-specific information for a game"""
        metadata = self._load_game_metadata(game_id)
        app_id = metadata.get("steamAppId")
        if not app_id:
            return None

        steam_info = self.steam_integration.get_game_steam_info(app_id)
        if not steam_info:
            return None

        info = dict(steam_info)
        info.setdefault("app_id", app_id)
        info["compatibility_tool"] = metadata.get("steamCompatibilityTool", info.get("compatibility_tool"))
        if "steamComponents" in metadata:
            info["components"] = metadata.get("steamComponents", [])
        if "steamLocale" in metadata:
            info["locale"] = metadata.get("steamLocale")
        info["game_id"] = game_id
        info["steamAddedAt"] = metadata.get("steamAddedAt")

        return info

    # Frontend API methods - Game Management
    def launch_game(self, game_id: str, launch_via_steam: bool = True) -> Dict[str, Any]:
        """Launch a game via Steam or directly"""
        # Check if game is installed
        if not self.game_library.is_game_installed(game_id):
            return {"success": False, "message": "Game not installed"}

        if launch_via_steam:
            # Launch via Steam (recommended)
            # This will use Steam's configured compatibility layer
            metadata = self._load_game_metadata(game_id)
            app_id = metadata.get("steamAppId")
            if not app_id:
                return {"success": False, "message": "Game not added to Steam. Use add_game_to_steam first."}

            # Launch using Steam
            steam_launch_cmd = f"steam://rungameid/{app_id}"

            try:
                import subprocess
                subprocess.Popen(["steam", steam_launch_cmd])
                return {"success": True, "message": f"Launched game via Steam (App ID: {app_id})"}
            except Exception as e:
                return {"success": False, "message": f"Failed to launch via Steam: {e}"}

        else:
            # Direct launch (fallback)
            game_exe = self.game_library.get_game_executable(game_id)
            if not game_exe:
                return {"success": False, "message": "Game executable not found"}

            try:
                import subprocess
                game_dir = self.games_dir / f"game_{game_id}"
                subprocess.Popen([str(game_exe)], cwd=str(game_dir))
                return {"success": True, "message": "Launched game directly"}
            except Exception as e:
                return {"success": False, "message": f"Failed to launch directly: {e}"}

    async def delete_game(self, game_id: str, remove_from_steam: bool = True) -> Dict[str, bool]:
        """Delete a game and its environment"""
        # Capture metadata before deleting files
        metadata_snapshot = self._load_game_metadata(game_id)

        # Delete game files
        game_deleted = self.game_library.delete_game(game_id)

        # Remove from Steam if requested
        if remove_from_steam:
            app_id = metadata_snapshot.get("steamAppId")
            if app_id:
                await self.steam_integration.remove_game_from_steam(app_id)

        if game_deleted:
            self.request_save_settings()

        return {"success": game_deleted}

    def get_installed_games(self) -> List[Dict[str, Any]]:
        """Get list of installed games with metadata"""
        installed_ids = self.game_library.get_installed_games()
        games = []

        for game_id in installed_ids:
            game_info = self.game_library.get_cached_game_info(game_id)
            if game_info:
                game_info = game_info.copy()
                game_info.setdefault("id", game_id)
                game_info["installed"] = True
                game_info["downloading"] = False
                game_info["progress"] = 100
                game_info["installDate"] = self.game_library.get_game_install_date(game_id)
                try:
                    size_bytes = self.game_library.get_game_size(game_id)
                    game_info["sizeBytes"] = size_bytes
                    game_info["size"] = self.format_file_size(size_bytes)
                except Exception as err:
                    decky.logger.warning(f"Failed to resolve size for {game_id}: {err}")
                games.append(game_info)
            else:
                # Fallback metadata for games without cached info
                try:
                    size_bytes = self.game_library.get_game_size(game_id)
                except Exception:
                    size_bytes = 0
                games.append({
                    "id": game_id,
                    "name": f"Game {game_id}",
                    "installed": True,
                    "downloading": False,
                    "progress": 100,
                    "installDate": self.game_library.get_game_install_date(game_id),
                    "sizeBytes": size_bytes,
                    "size": self.format_file_size(size_bytes) if size_bytes else "0B",
                })

        return games

    async def get_game_list(self) -> List[Dict[str, Any]]:
        """Aggregate available games from all known sources."""
        games: List[Dict[str, Any]] = []
        seen_ids: set[str] = set()

        async def run_fetch(label: str, coroutine: Awaitable[List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
            try:
                return await coroutine
            except Exception as err:
                decky.logger.warning(f"Failed to load {label} games: {err}")
                return []

        fetchers: List[Awaitable[List[Dict[str, Any]]]] = []

        if self.hikari_api.is_logged_in():
            fetchers.append(run_fetch("Hikari Field", self.get_hikari_game_list()))

        try:
            dlsite_logged_in = await self.dlsite_api.is_logged_in()
        except Exception as err:
            decky.logger.warning(f"Failed to query DLsite login state: {err}")
            dlsite_logged_in = False

        if dlsite_logged_in:
            fetchers.append(run_fetch("DLsite", self.get_dlsite_game_list()))

        if fetchers:
            results = await asyncio.gather(*fetchers, return_exceptions=False)
            for entries in results:
                for entry in entries or []:
                    game_id = entry.get("id")
                    if not game_id or game_id in seen_ids:
                        continue
                    seen_ids.add(game_id)
                    games.append(entry)

        try:
            installed_games = self.get_installed_games()
        except Exception as err:
            decky.logger.warning(f"Failed to enumerate installed games: {err}")
            installed_games = []

        for game in installed_games:
            game_id = game.get("id")
            if not game_id or game_id in seen_ids:
                continue
            games.append(game)
            seen_ids.add(game_id)

        return games

    # Advanced Game Management API methods
    async def verify_game_integrity(self, game_id: str, expected_hash: str = "") -> Dict[str, Any]:
        """Verify game file integrity"""
        return await self.game_library.verify_game_integrity(game_id, expected_hash)

    async def filter_games(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Filter games based on criteria"""
        games = await self.get_game_list()
        return self.game_library.filter_games(games, filters)

    async def sort_games(self, sort_by: str, reverse: bool = False) -> List[Dict[str, Any]]:
        """Sort games by specified criteria"""
        try:
            sort_enum = SortBy(sort_by)
        except ValueError:
            sort_enum = SortBy("name")

        games = await self.get_game_list()
        return self.game_library.sort_games(games, sort_enum, reverse)

    def add_game_tag(self, game_id: str, tag: str) -> Dict[str, bool]:
        """Add a tag to a game"""
        success = self.game_library.add_game_tag(game_id, tag)
        return {"success": success}

    def remove_game_tag(self, game_id: str, tag: str) -> Dict[str, bool]:
        """Remove a tag from a game"""
        success = self.game_library.remove_game_tag(game_id, tag)
        return {"success": success}

    def get_game_tags(self, game_id: str) -> List[str]:
        """Get tags for a game"""
        tags = self.game_library.get_game_tags(game_id)
        return list(tags)

    def get_all_tags(self) -> List[str]:
        """Get all unique tags across all games"""
        tags = self.game_library.get_all_tags()
        return list(tags)

    async def backup_game(self, game_id: str, backup_path: str = "") -> Dict[str, Any]:
        """Create a backup of a game"""
        if not backup_path:
            backup_path = str(self.games_dir / "backups")

        from pathlib import Path
        return await self.game_library.backup_game(game_id, Path(backup_path))

    async def restore_game(self, game_id: str, backup_path: str) -> Dict[str, Any]:
        """Restore a game from backup"""
        from pathlib import Path
        return await self.game_library.restore_game(game_id, Path(backup_path))

    def get_library_statistics(self) -> Dict[str, Any]:
        """Get statistics about the game library"""
        return self.game_library.get_library_statistics()

    async def optimize_library(self) -> Dict[str, Any]:
        """Optimize the game library"""
        return await self.game_library.optimize_library()

    async def update_last_played(self, game_id: str) -> Dict[str, bool]:
        """Update last played timestamp for a game"""
        try:
            self.game_library.update_last_played(game_id)
            self.request_save_settings()
            return {"success": True}
        except Exception as e:
            decky.logger.error(f"Failed to update last played: {e}")
            return {"success": False}

    # Enhanced download management
    async def get_download_progress(self, game_id: str) -> Dict[str, Any]:
        """Return normalized download progress for a game.

        Shape aligns with frontend utils (DownloadProgress/RawDownloadItem consumers):
        {
          gameId, gameName, progress, speed, eta, status,
          totalSize, downloadedSize, resumable, message, startedAt, updatedAt
        }
        """
        try:
            status = await self.download_manager.get_download_status(game_id)
            if not status:
                return {
                    "gameId": game_id,
                    "progress": 0,
                    "speed": 0,
                    "eta": 0,
                    "status": "pending",
                    "totalSize": 0,
                    "downloadedSize": 0,
                    "resumable": False,
                }

            # Permit multiple possible keys from Rust side
            game_name = status.get("game_name") or status.get("gameName") or f"Game {game_id}"
            eta = status.get("eta_seconds", status.get("eta", 0))
            total_size = status.get("total_size", status.get("totalSize", 0))
            downloaded_size = status.get("downloaded_size", status.get("downloadedSize", 0))
            progress = status.get("progress", 0)
            speed = status.get("speed", 0)
            raw_status = str(status.get("status", "downloading")).lower()
            message = status.get("message")
            resumable = bool(status.get("resumable", raw_status in ("paused", "failed")))

            return {
                "gameId": game_id,
                "gameName": game_name,
                "progress": progress,
                "speed": speed,
                "eta": eta,
                "status": raw_status,
                "totalSize": total_size,
                "downloadedSize": downloaded_size,
                "resumable": resumable,
                "message": message,
                "startedAt": status.get("started_at", status.get("startedAt")),
                "updatedAt": status.get("updated_at", status.get("updatedAt")),
            }
        except Exception as e:
            decky.logger.error(f"Failed to get download progress for {game_id}: {e}")
            return {
                "gameId": game_id,
                "progress": 0,
                "speed": 0,
                "eta": 0,
                "status": "error",
                "totalSize": 0,
                "downloadedSize": 0,
                "resumable": False,
                "message": str(e),
            }

    async def get_download_progress_detailed(self, game_id: str) -> Dict[str, Any]:
        """Get detailed download progress including chunk information"""
        status = await self.download_manager.get_download_status(game_id)
        return status or {}

    async def switch_download_source(self, game_id: str, preferred_source: str) -> Dict[str, bool]:
        """Switch primary download source for a game"""
        try:
            result = await self.download_manager.switch_download_source(game_id, preferred_source)
            return {"success": result.get("success", False)}
        except Exception as e:
            decky.logger.error(f"Failed to switch download source: {e}")
            return {"success": False, "message": str(e)}

    # Utility methods
    def cleanup_orphaned_games(self) -> Dict[str, int]:
        """Clean up orphaned game directories"""
        cleaned_count = self.game_library.cleanup_orphaned_games()
        return {"cleaned": cleaned_count}

    # Performance monitoring API methods
    async def get_performance_stats(self) -> Dict[str, Any]:
        """Get current performance statistics"""
        return await self.performance_manager.get_stats()

    async def optimize_for_downloads(self) -> Dict[str, Any]:
        """Optimize system resources for download operations"""
        return await self.performance_manager.optimize_for_download()

    async def clear_cache(self, pattern: str = "") -> Dict[str, bool]:
        """Clear cached data"""
        try:
            if pattern:
                await self.performance_manager.cache_clear(pattern)
            else:
                await self.performance_manager.cache_clear()
            return {"success": True}
        except Exception as e:
            decky.logger.error(f"Failed to clear cache: {e}")
            return {"success": False}
