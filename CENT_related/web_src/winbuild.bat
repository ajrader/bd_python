:: echo off

:: compile & minify LESS
call lessc --clean-css less/app.less app.css

:: JS static analysis
for /r %%f in (js\*.js) do call jshint %%f

:: compile JS / AMD, insert "use strict" statements, extract source map
call browserify js/app.js -t reactify -t strictify --debug | exorcist bundle.js.map > bundle.js

:: minify JS
:: call uglifyjs bundle.js -c warnings=false -m --screw-ie8 --source-map bundle.js.map --in-source-map bundle.js.map -o bundle.js

:: concat JS libs
type libs\*.js > libs.js

:: add version info, move to dist directory
set VERSION=0.2.0

del dist\*.html
del dist\*.css
del dist\*.js

move app.css dist/app-%VERSION%.css
move bundle.js dist/bundle-%VERSION%.js
move bundle.js.map dist/bundle.js.map
move libs.js dist/libs-%VERSION%.js
copy index.html dist

powershell "(Get-Content dist\index.html) | ForEach-Object { $_ -replace 'bundle.js', 'bundle-%VERSION%.js' } | Set-Content dist\index.html"
powershell "(Get-Content dist\index.html) | ForEach-Object { $_ -replace 'libs.js', 'libs-%VERSION%.js' } | Set-Content dist\index.html"
powershell "(Get-Content dist\index.html) | ForEach-Object { $_ -replace 'app.css', 'app-%VERSION%.css' } | Set-Content dist\index.html"

:: copy from web_src\dist to web_app\static

copy dist\*.js ..\web_app\static
copy dist\*.css ..\web_app\static
copy dist\*.map ..\web_app\static

:: echo 'Done'

:: pause