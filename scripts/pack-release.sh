#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"

mkdir -p "$RELEASE_DIR"

npm run build --workspace @airix/video-core
npm run build --workspace @airix/video-react
npm run build --workspace @airix/video-react-native
npm run build --workspace @airix/video-webhooks

npm pack --workspace @airix/video-core --pack-destination "$RELEASE_DIR"
npm pack --workspace @airix/video-react --pack-destination "$RELEASE_DIR"
npm pack --workspace @airix/video-react-native --pack-destination "$RELEASE_DIR"
npm pack --workspace @airix/video-webhooks --pack-destination "$RELEASE_DIR"

printf "\nPacked AIRIX SDK tarballs:\n"
ls -1 "$RELEASE_DIR"/*.tgz
