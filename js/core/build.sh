#!/bin/bash

EXTERNS=(
	"http://documentcloud.github.com/underscore/underscore.js"
	"https://raw.github.com/wookiehangover/underscore.Deferred/master/lib/underscore.deferred.js"
	"http://code.jquery.com/jquery-latest.js"
)

DEPS=(
	"uuid.js"
	"Runtime.js"
	"LocalStore.js"
)

ARTIFACTS=(
	"jefri.js"
	"jefri.min.js"
)

if [ $0 = "build.sh" ] ; then
	PIDS=()
	find . -type f -name '*coffee' | while read F ; do
		coffee -c $1 $F &
		PIDS+=("$!")
	done
	if [ "x$1" = "x-w" ] ; then
		read -p "Pres any key to continue."
		echo ${PIDS[@]}
	fi
elif [ $0 = "deploy.sh" ] ; then
	sh build.sh
	echo "" >| jefri.js
	if [ "x$1" = "x-e" ] ; then
		curl ${EXTERNS[@]} 2>/dev/null >> jefri.js
	fi
	cat ${DEPS[@]} >> jefri.js
	uglifyjs jefri.js >| jefri.min.js
elif [ $0 = "clean.sh" ] ; then
    find . -type f -name '*coffee' | sed 's/coffee$/js/' | xargs rm
	rm ${ARTIFACTS[@]}
fi
