const CODE_EDITOR_ID = "codeEditor";
const STATUS_DISPLAY_ID = "statusDisplay";
const CANVAS_ID = "canvas";
const MINIFY_ID = "minify";
const BEAUTIFY_ID = "beautify";
const EXAMPLE_ID = "example";
const SHARE_ID = "share";
const EXAMPLE_LINK_CLASS = "ref-example";

const toolkit = PlantLang.getToolkit();
let lastInstructions = [];
let lastCode = null;
let editor = null;
let mouseX = 0;
let mouseY = 0;
let startTime = new Date().getTime();


// Thanks https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }


class SpeedSettings {

  constructor(multiplier, offset) {
    const self = this;
    self._multiplier = multiplier;
    self._offset = offset;
  }

  getMultiplier() {
    const self = this;
    return self._multiplier;
  }

  getOffset() {
    const self = this;
    return self._offset;
  }

}


class State {

  constructor(canvas, canvasContext, mouseX, mouseY, duration, curDate) {
    const self = this;
    self._canvas = canvas;
    self._canvasContext = canvasContext;
    self._mouseX = mouseX;
    self._mouseY = mouseY;
    self._duration = duration;
    self._curDate = curDate;
    self._indicies = [0];
    self._widths = [10];
    self._speeds = [new SpeedSettings(1, 0)];
  }

  getCanvas() {
    const self = this;
    return self._canvas;
  }

  getCanvasContext() {
    const self = this;
    return self._canvasContext;
  }

  getIndex(levels) {
    const self = this;
    if (levels >= self._indicies.length) {
      return 0;
    } else {
      return self._indicies[self._indicies.length - 1 - levels];
    }
  }

  setIndex(index) {
    const self = this;
    self._indicies[self._indicies.length - 1] = index;
  }

  getWidth() {
    const self = this;
    return self._widths[self._widths.length - 1];
  }

  setWidth(newWidth) {
    const self = this;
    self._widths[self._widths.length - 1] = newWidth;
  }

  getMouseX() {
    const self = this;
    return self._mouseX;
  }

  getMouseY() {
    const self = this;
    return self._mouseY;
  }

  getDuration() {
    const self = this;

    const speedSettings = self.getSpeedSettings();
    const multiplier = speedSettings.getMultiplier();
    const offset = speedSettings.getOffset();

    return self._duration * multiplier + offset;
  }

  getMillisecond() {
    const self = this;
    return self._curDate.getMilliseconds();
  }

  getSecond() {
    const self = this;
    return self._curDate.getSeconds();
  }

  getMinute() {
    const self = this;
    return self._curDate.getMinutes();
  }

  getHour() {
    const self = this;
    return self._curDate.getHours();
  }

  getDay() {
    const self = this;
    return self._curDate.getDate() - 1;
  }

  getMonth() {
    const self = this;
    return self._curDate.getMonth();
  }

  getYear() {
    const self = this;
    return self._curDate.getYear();
  }

  getSpeedSettings() {
    const self = this;
    return self._speeds[self._speeds.length - 1];
  }

  setSpeedSettings(newSpeedSettings) {
    const self = this;
    self._speeds[self._speeds.length - 1] = newSpeedSettings;
  }

  save() {
    const self = this;

    self.getCanvasContext().save();
    self._indicies.push(self.getIndex(0));
    self._widths.push(self.getWidth());
    self._speeds.push(self.getSpeedSettings());
  }

  restore() {
    const self = this;

    self.getCanvasContext().restore();
    self._indicies.pop();
    self._widths.pop();
    self._speeds.pop();
  }

}


class CompileVisitor extends toolkit.PlantLangVisitor {

  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();

    const signMultiplier = raw.includes("-") ? -1 : 1;

    const bodyRawText = ctx.getChild(ctx.getChildCount() - 1).getText();
    const bodyParsed = signMultiplier * parseFloat(bodyRawText);

    const multipliers = [(state) => bodyParsed];

    const iterMatches = raw.match(/(\.)*iter/g);

    if (iterMatches !== null) {
      iterMatches.forEach((match) => {
        const numLevels = self._count(match, ".");
        multipliers.push((state) => state.getIndex(numLevels));
      });
    }

    const numRand = self._count(raw, "rand");
    if (numRand > 0) {
      let randStatic = 1;

      for (let i = 0; i < numRand; i++) {
        randStatic *= Math.random();
      }

      multipliers.push((state) => randStatic);
    }

    const numX = self._count(raw, "mouseX");
    if (numX > 0) {
      multipliers.push((state) => Math.pow(state.getMouseX(), numX));
    }

    const numY = self._count(raw, "mouseY");
    if (numY > 0) {
      multipliers.push((state) => Math.pow(state.getMouseY(), numY));
    }

    const numDur = self._count(raw, "dur");
    if (numDur > 0) {
      multipliers.push((state) => Math.pow(state.getDuration(), numDur));
    }

    const numSin = self._count(raw, "sin");
    if (numSin > 0) {
      multipliers.push((state) => Math.pow(
        Math.sin(state.getDuration() / Math.PI),
        numSin
      ));
    }

    const numMillis = self._count(raw, "millis");
    if (numMillis > 0) {
      multipliers.push((state) => Math.pow(state.getMillisecond(), numMillis));
    }

    const numSec = self._count(raw, "sec");
    if (numSec > 0) {
      multipliers.push((state) => Math.pow(state.getSecond(), numSec));
    }

    const numMin = self._count(raw, "min");
    if (numMin > 0) {
      multipliers.push((state) => Math.pow(state.getMinute(), numMin));
    }

    const numHour = self._count(raw, "hour");
    if (numHour > 0) {
      multipliers.push((state) => Math.pow(state.getHour(), numHour));
    }

    const numDay = self._count(raw, "day");
    if (numDay > 0) {
      multipliers.push((state) => Math.pow(state.getDay(), numDay));
    }

    const numMonth = self._count(raw, "month");
    if (numMonth > 0) {
      multipliers.push((state) => Math.pow(state.getMonth(), numMonth));
    }

    const numYear = self._count(raw, "year");
    if (numYear > 0) {
      multipliers.push((state) => Math.pow(state.getYear(), numYear));
    }

    return (state) => {
      const realized = multipliers.map((x) => x(state));
      return realized.reduce((a, b) => a * b);
    };
  }

  visitStem(ctx) {
    const self = this;

    const lengthFuture = ctx.distance.accept(self);

    const futureFunc = (state) => {
      const length = lengthFuture(state);
      state.getCanvasContext().fillRect(
        -state.getWidth()/2,
        0,
        state.getWidth(),
        length
      );

      state.getCanvasContext().translate(0, length);
    };

    return [futureFunc];
  }

  visitSkip(ctx) {
    const self = this;

    const lengthFuture = ctx.distance.accept(self);

    const futureFunc = (state) => {
      const length = lengthFuture(state);
      state.getCanvasContext().translate(0, length);
    };

    return [futureFunc];
  }

  visitWidth(ctx) {
    const self = this;

    const targetFuture = ctx.target.accept(self);
    const isRel = ctx.units.text === "rel";

    const futureFunc = (state) => {
      const target = targetFuture(state);
      const newWidth = isRel ? state.getWidth() * target : target;
      state.setWidth(newWidth);
    };

    return [futureFunc];
  }

  visitRotate(ctx) {
    const self = this;

    const targetFuture = ctx.target.accept(self);
    const isDeg = ctx.units.text === "deg";

    const futureFunc = (state) => {
      const target = targetFuture(state);
      const targetPi = isDeg ? target * Math.PI / 180 : target * Math.PI;
      state.getCanvasContext().rotate(targetPi);
    };

    return [futureFunc];
  }

  visitColor(ctx) {
    const self = this;

    const hexCode = ctx.target.text;
    const hasTrans = ctx.getChildCount() > 2;
    const futureTrans = hasTrans ? ctx.getChild(3).accept(self) : null;

    const futureFunc = (state) => {
      state.getCanvasContext().fillStyle = hexCode;

      if (hasTrans) {
        state.getCanvasContext().globalAlpha = futureTrans(state);
      }
    };

    return [futureFunc];
  }

  visitSpeed(ctx) {
    const self = this;

    const numChildren = ctx.getChildCount();
    const hasStart = numChildren > 2;
    const futureTarget = ctx.target.accept(self);
    const futureStart = hasStart ? ctx.getChild(3).accept(self) : (x) => 0;

    const futureFunc = (state) => {
      const target = futureTarget(state);
      const start = futureStart(state);
      state.setSpeedSettings(new SpeedSettings(target, start));
    };

    return [futureFunc];
  }

  visitFlower(ctx) {
    const self = this;

    const radiusFuture = ctx.radius.accept(self);

    const futureFunc = (state) => {
      const radius = radiusFuture(state);

      state.getCanvasContext().beginPath();
      state.getCanvasContext().arc(0, 0, radius, 0, 2 * Math.PI, false);
      state.getCanvasContext().fill();
    };

    return [futureFunc];
  }

  visitBranch(ctx) {
    const self = this;

    const instructions = [];
    const numSubPrograms = (ctx.getChildCount() - 1) / 2;

    for (let i = 0; i < numSubPrograms; i++) {
      const subProgram = ctx.getChild(2 + i * 2).accept(self);
      instructions.push((state) => state.save());
      instructions.push((state) => state.setIndex(i));
      instructions.push.apply(instructions, subProgram);
      instructions.push((state) => state.restore());
    }

    return instructions;
  }

  visitFrac(ctx) {
    const self = this;

    const instructions = [];
    const subProgram = ctx.getChild(ctx.getChildCount() - 1).accept(self);
    const numFrac = parseFloat(ctx.getChild(1).getText());

    for (let i = 0; i < numFrac; i++) {
      instructions.push((state) => state.save());
      instructions.push((state) => state.setIndex(i));
      instructions.push.apply(instructions, subProgram);
      instructions.push((state) => state.restore());
    }

    return instructions;
  }

  visitCommand(ctx) {
    const self = this;
    const instructions = ctx.getChild(0).accept(self);

    return instructions;
  }

  visitProgram(ctx) {
    const self = this;

    const instructions = [];

    const numCommands = ctx.getChildCount() / 2;
    for (let i = 0; i < numCommands; i++) {
      const newInstructions = ctx.getChild(i * 2).accept(self);
      instructions.push.apply(instructions, newInstructions);
    }

    return instructions;
  }

  _count(target, match) {
    const self = this;
    return target.split(match).length - 1;
  }

}


class CodeComponent {

  constructor(commandType, command) {
    const self = this;
    self._commandType = commandType;
    self._command = command;
  }

  getCommandType() {
    const self = this;
    return self._commandType;
  }

  getCommand() {
    const self = this;
    return self._command;
  }

}


class BeautifyVisitor extends toolkit.PlantLangVisitor {

  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();

    return raw.replace(/iter\s*/g, "iter ")
      .replace(/rand\s*/g, "rand ")
      .replace(/mouseX\s*/g, "mouseX ")
      .replace(/mouseY\s*/g, "mouseY ")
      .replace(/sin\s*/g, "sin ")
      .replace(/dur\s*/g, "dur ")
      .replace(/millis\s*/g, "millis ")
      .replace(/sec\s*/g, "sec ")
      .replace(/min\s*/g, "min ")
      .replace(/hour\s*/g, "hour ")
      .replace(/day\s*/g, "day ")
      .replace(/month\s*/g, "month ")
      .replace(/year\s*/g, "year ")
      .replace(/\-\s*/g, "-")
      .replace(/\+\s*/g, "+");
  }

  visitStem(ctx) {
    const self = this;

    const numberText = ctx.getChild(1).accept(self);
    const immediate = "stem " + numberText;

    return [new CodeComponent("simple", immediate)];
  }

  visitSkip(ctx) {
    const self = this;

    const numberText = ctx.getChild(1).accept(self);
    const immediate = "skip " + numberText;

    return [new CodeComponent("simple", immediate)];
  }

  visitWidth(ctx) {
    const self = this;

    const numberText = ctx.target.accept(self);
    const immediate = "width " + numberText + " " + ctx.units.text;

    return [new CodeComponent("simple", immediate)];
  }

  visitRotate(ctx) {
    const self = this;

    const numberText = ctx.target.accept(self);
    const immediate = "rotate " + numberText + " " + ctx.units.text;

    return [new CodeComponent("simple", immediate)];
  }

  visitColor(ctx) {
    const self = this;

    const core = "color " + ctx.target.text;
    const numChildren = ctx.getChildCount();

    let transAppend = "";
    if (numChildren > 2) {
      const numberText = ctx.getChild(3).accept(self);
      transAppend = " trans " + numberText;
    }

    const immediate = core + transAppend;
    return [new CodeComponent("simple", immediate)];
  }

  visitSpeed(ctx) {
    const self = this;

    const core = "speed " + ctx.target.accept(self);
    const numChildren = ctx.getChildCount();

    let startAppend = "";
    if (numChildren > 2) {
      const numberText = ctx.getChild(3).accept(self);
      startAppend = " start " + numberText;
    }

    const immediate = core + startAppend;
    return [new CodeComponent("simple", immediate)];
  }

  visitFlower(ctx) {
    const self = this;

    const numberText = ctx.radius.accept(self);
    const immediate = "flower " + numberText;

    return [new CodeComponent("simple", immediate)];
  }

  visitBranch(ctx) {
    const self = this;

    const numSubPrograms = (ctx.getChildCount() - 1) / 2;

    const allCommands = [new CodeComponent("branch", "branch")];
    for (let i = 0; i < numSubPrograms; i++) {
      const subProgram = ctx.getChild(2 + i * 2).accept(self);
      allCommands.push(new CodeComponent("subBranchStart", ""));
      allCommands.push.apply(allCommands, subProgram);
      allCommands.push(new CodeComponent("end", ""));
      allCommands.push(new CodeComponent("subBranchEnd", ""));
    }

    return allCommands;
  }

  visitFrac(ctx) {
    const self = this;

    const immediate = "frac " + ctx.getChild(1).getText();
    const allCommands = [new CodeComponent("branch", immediate)];
    const subProgram = ctx.getChild(3).accept(self);
    allCommands.push(new CodeComponent("subBranchStart", ""));
    allCommands.push.apply(allCommands, subProgram);
    allCommands.push(new CodeComponent("end", ""));
    allCommands.push(new CodeComponent("subBranchEnd", ""));

    return allCommands;
  }

  visitCommand(ctx) {
    const self = this;
    const instructions = ctx.getChild(0).accept(self);

    return instructions;
  }

  visitProgram(ctx) {
    const self = this;

    const allCommands = [];

    const numCommands = ctx.getChildCount() / 2;
    for (let i = 0; i < numCommands; i++) {
      const newCommands = ctx.getChild(i * 2).accept(self);
      allCommands.push.apply(allCommands, newCommands);
    }

    return allCommands;
  }

}


function getSourceCode() {
  return editor.getValue();
}


function getProgram(input) {
  if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
    document.getElementById(STATUS_DISPLAY_ID).textContent = "Ready!";
    return null;
  }

  const errors = [];

  const chars = new toolkit.antlr4.InputStream(input);
  const lexer = new toolkit.PlantLangLexer(chars);
  lexer.removeErrorListeners();
  lexer.addErrorListener({
    syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
      const result = `(line ${line}, col ${column}): ${msg}`;
      errors.push(result);
    }
  });

  const tokens = new toolkit.antlr4.CommonTokenStream(lexer);
  const parser = new toolkit.PlantLangParser(tokens);

  parser.buildParsePlants = true;
  parser.removeErrorListeners();
  parser.addErrorListener({
    syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
      const result = `(line ${line}, col ${column}): ${msg}`;
      errors.push(result);
    }
  });

  const program = parser.program();
  const errorsEscaped = errors.map(escapeHtml);
  const errorsHtml = errorsEscaped.join(".<br> ");
  document.getElementById(STATUS_DISPLAY_ID).innerHTML = errorsHtml;

  return errors.length == 0 ? program : null;
}


function compile() {
  const program = getProgram(getSourceCode());
  if (program === null) {
    return null;
  }

  return program.accept(new CompileVisitor());
}


function render(instructions) {
  const canvas = document.getElementById(CANVAS_ID);
  const canvasContext = canvas.getContext('2d');

  const duration = ((new Date().getTime()) - startTime) / 1000;
  const state = new State(
    canvas,
    canvasContext,
    mouseX,
    mouseY,
    duration,
    new Date()
  );

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);

  canvasContext.save();

  canvasContext.translate(canvas.width / 2, canvas.height - 10);
  canvasContext.rotate(Math.PI);

  if (instructions !== null) {
    instructions.forEach((instruction) => {
      instruction(state);
    });
  }

  canvasContext.restore();
}


function checkChange() {
  const newCode = getSourceCode();
  if (lastCode === newCode) {
    return;
  }
  lastCode = newCode;

  const instructions = compile();
  if (instructions === null) {
    return;
  }
  lastInstructions = instructions;

  updateHistory(true);
}


function updateHistory(replace) {
  const program = getProgram(getSourceCode());

  if (program === null) {
    return;
  }

  const original = getSourceCode();
  const minified = original.replace(/\s+/g, "");

  const currentUrl = window.location.href;
  const urlStart = currentUrl.split("?")[0];
  const fullUrl = "?code=" + encodeURIComponent(minified);

  if (replace) {
    window.history.replaceState('', '', fullUrl);
  } else {
    window.history.pushState('', '', fullUrl);
  }
}


function minifyTarget(input) {
  const program = getProgram(input);

  if (program === null) {
    return null;
  }

  const original = getSourceCode();
  const minified = original.replace(/\s+/g, "");
  return minified;
}


function executeMinify() {
  const minified = minifyTarget(getSourceCode());

  if (minified === null) {
    alert("Please fix errors before minifying.");
    return;
  }

  editor.setValue(minified);
}


function beautifyTarget(input) {
  const program = getProgram(input);

  if (program === null) {
    return null;
  }

  const components = program.accept(new BeautifyVisitor());

  let outputProgram = "";
  let indentSize = 0;
  let first = true;
  let firstAfterScopeChange = false;
  let numComponents = components.length;
  for (let i = 0; i < numComponents; i++) {
    const component = components[i];
    const commandType = component.getCommandType();
    const whitespace = " ".repeat(indentSize * 2);

    const writeRegularCommand = () => {
      const nonWhitespacePrefix = firstAfterScopeChange ? "> " : "| ";
      const prefix = whitespace + (first ? "" : nonWhitespacePrefix);
      outputProgram += prefix + component.getCommand() + "\n";
    };

    if (commandType === "simple") {
      writeRegularCommand();
      if (firstAfterScopeChange) {
        indentSize++;
      }
    } else if (commandType === "branch") {
      writeRegularCommand();
    } else if (commandType === "end") {
      outputProgram += whitespace + ";\n";
    } else if (commandType === "subBranchStart") {
      indentSize++;
    } else if (commandType === "subBranchEnd") {
      indentSize -= firstAfterScopeChange ? 1 : 2;
    }

    firstAfterScopeChange = commandType === "subBranchStart";

    first = false;
  }

  outputProgram += ";";
  return outputProgram;
}


function executeBeautify() {
  const outputProgram = beautifyTarget(getSourceCode());

  if (outputProgram === null) {
    alert("Please fix errors before minifying.");
    return;
  }

  editor.setValue(outputProgram);
}


function loadCodeFromUri() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const codeBeautified = beautifyTarget(code);

  editor.setValue(codeBeautified);
}


// Thanks https://stackoverflow.com/questions/24963246/ace-editor-simply-re-enable-command-after-disabled-it
function setCommandEnabled(editor, name, enabled) {
  var command = editor.commands.byName[name]
  if (!command.bindKeyOriginal)
    command.bindKeyOriginal = command.bindKey
  command.bindKey = enabled ? command.bindKeyOriginal : null;
  editor.commands.addCommand(command);
  // special case for backspace and delete which will be called from
  // textarea if not handled by main commandb binding
  if (!enabled) {
    var key = command.bindKeyOriginal;
    if (key && typeof key == "object")
      key = key[editor.commands.platform];
    if (/backspace|delete/i.test(key))
      editor.commands.bindKey(key, "null")
  }
}


function initEditor() {
  editor = ace.edit("editor");
  editor.getSession().setUseWorker(false);

  editor.session.setOptions({
      tabSize: 2,
      useSoftTabs: true
  });

  editor.setTheme("ace/theme/monokai");
  editor.on("change", () => checkChange());

  const setTabsEnabled = (target) => {
    setCommandEnabled(editor, "indent", target);
    setCommandEnabled(editor, "outdent", target);
  };

  editor.on("focus", () => { setTabsEnabled(true); });

  editor.commands.addCommand({
    name: "escape",
    bindKey: {win: "Esc", mac: "Esc"},
    exec: () => {
      setTabsEnabled(false);
    }
  });
}


function initListeners() {
  document.getElementById(SHARE_ID).addEventListener("click", (event) => {
    alert("To share your work, simply copy and paste the current URL. Your code is written to the address bar as you type.");
    event.preventDefault();
  });

  document.getElementById(MINIFY_ID).addEventListener("click", (event) => {
    executeMinify();
    event.preventDefault();
  });

  document.getElementById(BEAUTIFY_ID).addEventListener("click", (event) => {
    executeBeautify();
    event.preventDefault();
  });

  const canvas = document.getElementById(CANVAS_ID);
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, false);
}


function init() {
  initEditor();
  initListeners();
  loadCodeFromUri();

  setInterval(() => { render(lastInstructions); }, 0.05);
}


init();
