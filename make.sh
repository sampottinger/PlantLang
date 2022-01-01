cd language
java -jar antlr-4.9.3-complete.jar -Dlanguage=JavaScript TreeLang.g4 -visitor -o ../intermediate
cd ..
cd intermediate
npm run build
cd ..
cd demo
cd js
rm tree_lang.js
cp ../../intermediate/static/treelang.js tree_lang.js
