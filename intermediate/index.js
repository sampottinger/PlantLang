import antlr4 from 'antlr4';
import PlantLangLexer from './PlantLangLexer.js';
import PlantLangParser from './PlantLangParser.js';
import PlantLangListener from './PlantLangListener.js';
import PlantLangVisitor from './PlantLangVisitor.js';


function getToolkit() {
  return {
    "antlr4": antlr4,
    "PlantLangLexer": PlantLangLexer,
    "PlantLangParser": PlantLangParser,
    "PlantLangListener": PlantLangListener,
    "PlantLangVisitor": PlantLangVisitor
  };
}


export {getToolkit};
