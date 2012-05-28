#!/bin/sh

find . -name docs -type d -exec rm -rf '{}' +
mkdir docs
rm -rf ../docs/docs/js
find . -type d -not -path '*test*' -not -name . | sed 's/\.\///' | while read d
	do cd $d
	$(which node) $(which docco) *js *coffee
	cd -
	mkdir docs/$d/
	mv $d/docs/* docs/$d/
done

mv docs ../docs/docs/js
find . -name docs -type d -exec rm -rf '{}' +

