#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true
export PATH="/Users/tj/.nvm/versions/node/v20.19.1/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "/Users/tj/Documents/Claude/Projects/HubCity MVP/hubcity-app"
exec node node_modules/next/dist/bin/next dev --turbopack -p 3000
