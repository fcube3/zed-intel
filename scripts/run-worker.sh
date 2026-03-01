#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
exec node /Users/fengshen/.openclaw/workspace/kai-intel/scripts/worker.mjs
