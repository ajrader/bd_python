# compile & minify LESS
lessc --clean-css less/app.less app.css

# JS static analysis
jshint js/*

# compile JS / AMD, insert "use strict" statements, extract source map
browserify js/app.js -t reactify -t strictify --debug | exorcist bundle.js.map > bundle.js

# minify JS
uglifyjs bundle.js -c warnings=false -m --screw-ie8 --source-map bundle.js.map --in-source-map bundle.js.map -o bundle.js

# concat JS libs
cat libs/*.js > libs.js

# add version info, move to dist directory
VERSION=0.2.0

rm dist/*.html
rm dist/*.css
rm dist/*.js

mv app.css dist/app-$VERSION.css
mv bundle.js dist/bundle-$VERSION.js
mv bundle.js.map dist/bundle.js.map
mv libs.js dist/libs-$VERSION.js
cp index.html dist
cp map.svg dist

sed -i '' 's/bundle.js/bundle-'$VERSION.js'/g' dist/index.html
sed -i '' 's/libs.js/libs-'$VERSION.js'/g' dist/index.html
sed -i '' 's/app.css/app-'$VERSION.css'/g' dist/index.html

echo 'Done'

