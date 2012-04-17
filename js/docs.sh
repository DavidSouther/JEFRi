find . -name docs -type d -exec rm -rf '{}' +
mkdir docs
rm -rf ../docs/docs/js
find . -type d -not -path '*test*' -not -name . | sed 's/\.\//' | while read d 
do cd  
/usr/local/bin/node /usr/bin/docco *js 
cd - 
mkdir docs// 
mv /docs/* docs// 
done

mv docs ../docs/docs/js
find . -name docs -type d -exec rm -rf '{}' +
