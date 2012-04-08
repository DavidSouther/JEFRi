#!/bin/sh

for project in $(find . -maxdepth 1 -mindepth 1 -type d -not -name docs -not -name latex )
do
	cd $project
	rm -rf _out_
	mkdir _out_
	make -f ../latex/Makefile
	make -f ../latex/Makefile clean
	cd ..
done

find . -type f -path '*/_out_/*' | xargs -I{} cp {} ./docs/
