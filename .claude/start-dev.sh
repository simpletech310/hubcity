#!/bin/bash
cd "/Users/tj/Documents/Claude/Projects/HubCity MVP/hubcity-app"
exec node node_modules/.bin/next dev -p "${PORT:-3001}"
