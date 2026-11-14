#!/bin/zsh
set -eu
cd "${0:A:h}/backend"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
python3 scripts/setup-gmail.py
