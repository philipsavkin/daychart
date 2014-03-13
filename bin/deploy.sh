#!/bin/bash

set -e

REPO="git@github.com:philipsavkin/daychart.git"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
PAGEDIR="$DIR/../`basename $DIR`-pages"

if [ -d "$PAGEDIR" ]; then
    cd $PAGEDIR
    git pull origin
    git checkout gh-pages
    cd -
else
    git clone $REPO --branch gh-pages $PAGEDIR
fi

cd dist
rsync --checksum --recursive --delete --verbose --exclude=".git" . $PAGEDIR 

cd $PAGEDIR
git add -A
git commit -m "Deploy"
git push
cd -

