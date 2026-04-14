import logging

from supabase import create_client

from app.config import settings

logger = logging.getLogger(__name__)


def _get_supabase():
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def execute_command(
    command_type: str, params: dict | None, user_id: str
) -> dict:
    """Execute a voice command and return a result dict.

    Returns: {"success": bool, "message": str, "action": str, "data": dict|None}
    """
    params = params or {}

    handlers = {
        "create_folder": _create_folder,
        "delete_entry": _delete_entry,
        "move_entry": _move_entry,
    }

    handler = handlers.get(command_type)
    if not handler:
        return {
            "success": False,
            "message": f"Unknown command: {command_type}",
            "action": command_type,
            "data": None,
        }

    try:
        return await handler(params, user_id)
    except Exception as e:
        logger.error("Command execution failed (%s): %s", command_type, e)
        return {
            "success": False,
            "message": f"Failed to execute command: {str(e)}",
            "action": command_type,
            "data": None,
        }


async def _create_folder(params: dict, user_id: str) -> dict:
    folder_name = params.get("folder_name", "").strip()
    if not folder_name:
        return {
            "success": False,
            "message": "No folder name provided",
            "action": "create_folder",
            "data": None,
        }

    supabase = _get_supabase()

    # Check for duplicate
    existing = (
        supabase.table("folders")
        .select("id, name")
        .eq("user_id", user_id)
        .eq("name", folder_name)
        .is_("parent_id", "null")
        .execute()
    )
    if existing.data:
        return {
            "success": True,
            "message": f"Folder \"{folder_name}\" already exists",
            "action": "create_folder",
            "data": existing.data[0],
        }

    result = (
        supabase.table("folders")
        .insert({"user_id": user_id, "name": folder_name})
        .execute()
    )

    return {
        "success": True,
        "message": f"Created folder \"{folder_name}\"",
        "action": "create_folder",
        "data": result.data[0] if result.data else None,
    }


async def _delete_entry(params: dict, user_id: str) -> dict:
    target = params.get("target", "").strip()
    if not target:
        return {
            "success": False,
            "message": "No entry specified to delete",
            "action": "delete_entry",
            "data": None,
        }

    supabase = _get_supabase()

    if target == "last":
        # Delete the most recent entry
        entries = (
            supabase.table("entries")
            .select("id, title")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    else:
        # Search by description match
        entries = (
            supabase.table("entries")
            .select("id, title")
            .eq("user_id", user_id)
            .ilike("title", f"%{target}%")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

    if not entries.data:
        return {
            "success": False,
            "message": "No matching entry found",
            "action": "delete_entry",
            "data": None,
        }

    entry = entries.data[0]
    supabase.table("entries").delete().eq("id", entry["id"]).eq(
        "user_id", user_id
    ).execute()

    return {
        "success": True,
        "message": f"Deleted \"{entry['title']}\"",
        "action": "delete_entry",
        "data": {"entry_id": entry["id"], "title": entry["title"]},
    }


async def _move_entry(params: dict, user_id: str) -> dict:
    target = params.get("target", "").strip()
    folder_name = params.get("folder_name", "").strip()

    if not target or not folder_name:
        return {
            "success": False,
            "message": "Need both an entry and a folder to move to",
            "action": "move_entry",
            "data": None,
        }

    supabase = _get_supabase()

    # Find entry
    if target == "last":
        entries = (
            supabase.table("entries")
            .select("id, title")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    else:
        entries = (
            supabase.table("entries")
            .select("id, title")
            .eq("user_id", user_id)
            .ilike("title", f"%{target}%")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

    if not entries.data:
        return {
            "success": False,
            "message": "No matching entry found",
            "action": "move_entry",
            "data": None,
        }

    entry = entries.data[0]

    # Find or create folder
    folder_result = (
        supabase.table("folders")
        .select("id, name")
        .eq("user_id", user_id)
        .ilike("name", folder_name)
        .limit(1)
        .execute()
    )

    if folder_result.data:
        folder = folder_result.data[0]
    else:
        # Create the folder
        new_folder = (
            supabase.table("folders")
            .insert({"user_id": user_id, "name": folder_name})
            .execute()
        )
        folder = new_folder.data[0]

    # Move entry
    supabase.table("entries").update({"folder_id": folder["id"]}).eq(
        "id", entry["id"]
    ).eq("user_id", user_id).execute()

    return {
        "success": True,
        "message": f"Moved \"{entry['title']}\" to {folder['name']}",
        "action": "move_entry",
        "data": {
            "entry_id": entry["id"],
            "folder_id": folder["id"],
            "folder_name": folder["name"],
        },
    }
