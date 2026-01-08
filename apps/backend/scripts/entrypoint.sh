#!/bin/sh
# entrypoint.sh

yarn db:migrate
exec node dist/src/server.js