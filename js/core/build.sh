#!/bin/bash

if [ $0 = "build.sh" ] ; then
	find . -type f -name '*coffee' -exec coffee -c {} +
elif [ $0 = "clean.sh" ] ; then
    find . -type f -name '*coffee' | sed 's/coffee$/js/' | xargs rm
fi
