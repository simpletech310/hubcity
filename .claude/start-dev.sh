#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "/Users/tj/Documents/Claude/Projects/HubCity MVP/hubcity-app"
exec npx next dev --turbopack -p 3000
