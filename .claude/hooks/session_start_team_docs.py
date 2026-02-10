#!/usr/bin/env python3
"""
SessionStart hook for WebPhim Team.
Injects team workflow and role prompt into agent context on startup.
"""

import os
import subprocess
import sys

# Project configuration
PROJECT_ROOT = "/Users/phuhung/Documents/Studies/AIProjects/webphim"

TEAM_CONFIGS = {
    "webphim_team": {
        "docs_dir": os.path.join(PROJECT_ROOT, "docs/tmux/webphim-team"),
        "roles": {"PO", "SM", "TL", "FE", "BE", "QA"},
    },
}


def get_tmux_session():
    """Get current tmux session name."""
    tmux_env = os.environ.get("TMUX")
    if not tmux_env:
        return None
    try:
        result = subprocess.run(
            ["tmux", "display-message", "-p", "#{session_name}"],
            capture_output=True,
            text=True,
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception:
        return None


def get_role_name():
    """Get role name from tmux pane option @role_name using $TMUX_PANE."""
    tmux_pane = os.environ.get("TMUX_PANE")
    if not tmux_pane:
        return None
    try:
        result = subprocess.run(
            ["tmux", "show-options", "-pt", tmux_pane, "-qv", "@role_name"],
            capture_output=True,
            text=True,
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception:
        return None


def read_file(path):
    """Read file content."""
    try:
        with open(path, "r") as f:
            return f.read()
    except Exception:
        return None


def main():
    session = get_tmux_session()
    if not session or session not in TEAM_CONFIGS:
        return

    config = TEAM_CONFIGS[session]
    role = get_role_name()

    if not role or role not in config["roles"]:
        return

    docs_dir = config["docs_dir"]
    output_parts = []

    # Read workflow
    workflow_path = os.path.join(docs_dir, "workflow.md")
    workflow = read_file(workflow_path)
    if workflow:
        output_parts.append(f"# Team Workflow\n\n{workflow}")

    # Read role prompt
    prompt_path = os.path.join(docs_dir, f"prompts/{role}_PROMPT.md")
    prompt = read_file(prompt_path)
    if prompt:
        output_parts.append(f"# Your Role: {role}\n\n{prompt}")

    # Read WHITEBOARD
    whiteboard_path = os.path.join(docs_dir, "WHITEBOARD.md")
    whiteboard = read_file(whiteboard_path)
    if whiteboard:
        output_parts.append(f"# Current Status (WHITEBOARD)\n\n{whiteboard}")

    if output_parts:
        print("\n\n---\n\n".join(output_parts))


if __name__ == "__main__":
    main()
