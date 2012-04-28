#!/bin/sh

rm json.js
coffee -p json.coffee >| json.js
