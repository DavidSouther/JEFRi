#\!/bin/sh 

find . -name docs -exec rm -rf '{}' +
mkdir docs
find . -type d -not -path '*test*' -not -name . | while read d 
	do cd $d 
	docco *js 
	cd - 
	mkdir docs/$d/ 
	mv $d/docs/* docs/$d/ 
done

mv docs ../docs/docs/js
