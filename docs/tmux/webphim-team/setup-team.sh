#!/bin/bash
# WebPhim Team - Automated Setup Script

set -e

PROJECT_ROOT="/Users/phuhung/Documents/Studies/AIProjects/webphim"
SESSION_NAME="webphim_team"

echo "Starting WebPhim Team Setup..."

# Check if tm-send exists
if ! command -v tm-send &> /dev/null; then
    echo "ERROR: tm-send not found. Install it at ~/.local/bin/tm-send first."
    exit 1
fi

# Kill existing session if exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "Killing existing session..."
    tmux kill-session -t $SESSION_NAME
fi

# Create session
cd "$PROJECT_ROOT"
tmux new-session -d -s $SESSION_NAME

# Create 6-pane layout (PO, SM, TL, FE, BE, QA)
tmux split-window -h -t $SESSION_NAME
tmux split-window -h -t $SESSION_NAME
tmux select-layout -t $SESSION_NAME even-horizontal
tmux select-pane -t $SESSION_NAME:0.0
tmux split-window -v -t $SESSION_NAME:0.0
tmux select-pane -t $SESSION_NAME:0.2
tmux split-window -v -t $SESSION_NAME:0.2
tmux select-pane -t $SESSION_NAME:0.4
tmux split-window -v -t $SESSION_NAME:0.4

# Set pane titles (visual display)
tmux select-pane -t $SESSION_NAME:0.0 -T "PO"
tmux select-pane -t $SESSION_NAME:0.1 -T "SM"
tmux select-pane -t $SESSION_NAME:0.2 -T "TL"
tmux select-pane -t $SESSION_NAME:0.3 -T "FE"
tmux select-pane -t $SESSION_NAME:0.4 -T "BE"
tmux select-pane -t $SESSION_NAME:0.5 -T "QA"

# Set @role_name options (stable - won't be overwritten by Claude Code)
tmux set-option -p -t $SESSION_NAME:0.0 @role_name "PO"
tmux set-option -p -t $SESSION_NAME:0.1 @role_name "SM"
tmux set-option -p -t $SESSION_NAME:0.2 @role_name "TL"
tmux set-option -p -t $SESSION_NAME:0.3 @role_name "FE"
tmux set-option -p -t $SESSION_NAME:0.4 @role_name "BE"
tmux set-option -p -t $SESSION_NAME:0.5 @role_name "QA"

echo "Starting Claude Code in each pane..."

# Start Claude Code in each pane
for i in 0 1 2 3 4 5; do
    tmux send-keys -t $SESSION_NAME:0.$i "cd $PROJECT_ROOT && claude" C-m
done

echo "Waiting for Claude Code to start..."
sleep 15

# Initialize roles
echo "Initializing roles..."
tmux send-keys -t $SESSION_NAME:0.0 "/init-role PO" C-m
sleep 1
tmux send-keys -t $SESSION_NAME:0.0 C-m

tmux send-keys -t $SESSION_NAME:0.1 "/init-role SM" C-m
sleep 1
tmux send-keys -t $SESSION_NAME:0.1 C-m

tmux send-keys -t $SESSION_NAME:0.2 "/init-role TL" C-m
sleep 1
tmux send-keys -t $SESSION_NAME:0.2 C-m

tmux send-keys -t $SESSION_NAME:0.3 "/init-role FE" C-m
sleep 1
tmux send-keys -t $SESSION_NAME:0.3 C-m

tmux send-keys -t $SESSION_NAME:0.4 "/init-role BE" C-m
sleep 1
tmux send-keys -t $SESSION_NAME:0.4 C-m

tmux send-keys -t $SESSION_NAME:0.5 "/init-role QA" C-m
sleep 1
tmux send-keys -t $SESSION_NAME:0.5 C-m

echo ""
echo "=========================================="
echo "WebPhim Team Setup Complete!"
echo "=========================================="
echo ""
echo "Session: $SESSION_NAME"
echo ""
echo "Team Roles:"
echo "  Pane 0: PO (Product Owner)"
echo "  Pane 1: SM (Scrum Master)"
echo "  Pane 2: TL (Tech Lead)"
echo "  Pane 3: FE (Frontend)"
echo "  Pane 4: BE (Backend)"
echo "  Pane 5: QA (Tester)"
echo ""
echo "Attach with: tmux attach -t $SESSION_NAME"
echo ""
