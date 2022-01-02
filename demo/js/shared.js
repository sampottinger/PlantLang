/**
 * Global state for the online Plant editor.
 *
 * @author Sam Pottinger
 * @license MIT License
 */

const toolkit = PlantLang.getToolkit();
let lastInstructions = [];
let lastCode = null;
let editor = null;
let mouseX = 0;
let mouseY = 0;
let startTime = new Date().getTime();
