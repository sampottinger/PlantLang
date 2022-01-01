import antlr4 from 'antlr4';
import TreeLangLexer from './TreeLangLexer.js';
import TreeLangParser from './TreeLangParser.js';
import TreeLangListener from './TreeLangListener.js';
import TreeLangVisitor from './TreeLangVisitor.js';


function getToolkit() {
  return {
    "antlr4": antlr4,
    "TreeLangLexer": TreeLangLexer,
    "TreeLangParser": TreeLangParser,
    "TreeLangListener": TreeLangListener,
    "TreeLangVisitor": TreeLangVisitor
  };
}


export {getToolkit};
