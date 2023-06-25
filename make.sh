cd language
if [ ! -f antlr-4.13.0-complete.jar ]; then
  wget https://github.com/antlr/website-antlr4/raw/gh-pages/download/antlr-4.13.0-complete.jar
fi
java -jar antlr-4.13.0-complete.jar -Dlanguage=JavaScript PlantLang.g4 -visitor -o ../intermediate
cd ..
cd intermediate
npm run build
cd ..
cd demo
cd js
rm plant_lang.js
cp ../../intermediate/static/plantlang.js plant_lang.js
