#!/bin/bash
export PATH="/Users/tj/.nvm/versions/node/v20.19.1/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"
cd "/Users/tj/Documents/Claude/Projects/HubCity MVP/hubcity-app"
exec /Users/tj/.nvm/versions/node/v20.19.1/bin/node node_modules/next/dist/bin/next dev --turbopack -p 3000
