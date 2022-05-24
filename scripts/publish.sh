#!/usr/bin/env bash

set -u -e -o pipefail

readonly RAW_TAG=$(git describe --abbrev=7 --tags HEAD)
readonly NAME=$(echo $RAW_TAG | cut -d '-' -f1)
readonly VERSION=$(echo $RAW_TAG | cut -d '-' -f2)

echo Publishing $NAME with version $VERSION \(tag: $RAW_TAG\)

yarn nx run $NAME:publish --container_version=$VERSION
