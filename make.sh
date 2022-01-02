cd language
java -jar antlr-4.9.3-complete.jar -Dlanguage=JavaScript PlantLang.g4 -visitor -o ../intermediate
cd ..
cd intermediate
npm run build
cd ..
cd demo
cd js
rm plant_lang.js
cp ../../intermediate/static/plantlang.js plant_lang.js
