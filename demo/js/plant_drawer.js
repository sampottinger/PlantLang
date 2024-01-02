/**
 * Driver for the online Plant editor.
 *
 * @author Sam Pottinger
 * @license MIT License
 */


/**
 * Convienence function to get currently entered source code.
 *
 * @return String source code (Plant code) which may or may not be valid.
 */
function getSourceCode() {
  return editor.getValue();
}


/**
 * Get the abstract syntax tree for an input source code.
 *
 * @param input The source code to parse.
 * @return A ParseResult.
 */
function getProgram(input) {
  if (input === null) {
    return new ParseResult(null, []);
  }

  if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
    document.getElementById(STATUS_DISPLAY_ID).textContent = "Ready!";
    return new ParseResult(null, []);
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

  const outputProgram = errors.length == 0 ? program : null;
  return new ParseResult(outputProgram, errors);
}


/**
 * Run the source code currently entered by the user.
 *
 * Parse and compile the source code currently entered by the user. If there are
 * errors, display them.
 *
 * @return List of functions which can run on a State object or null if compile
 *   error.
 */
function compile() {
  const program = getProgram(getSourceCode());
  const errorsEscaped = program.getErrors().map(escapeHtml);
  const errorsHtml = errorsEscaped.join(".<br> ");
  document.getElementById(STATUS_DISPLAY_ID).innerHTML = errorsHtml;

  if (!program.getWasSuccessful()) {
    return null;
  }

  return program.getAst().accept(new CompileVisitor());
}


/**
 * Run a single frame of a Plant program.
 *
 * @param instructions The compiled Plant program to run (list of functions).
 */
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


/**
 * Check for new code from user.
 *
 * Check if the code entered by the user has changed and, if so, attempt to
 * update the currently running program and browser history.
 */
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

  startTime = new Date().getTime();

  updateHistory(true);
  resetInterval();
}


/**
 * Update the Plant code saved to the address bar.
 *
 * @param replace Flag indicating if the current browser history should be
 *   replaced. If true, the current record is replaced. If false, a new history
 *   record is made.
 */
function updateHistory(replace) {
  let program = getProgram(getSourceCode());

  if (!program.getWasSuccessful()) {
    return null;
  }

  const original = getSourceCode();
  const minified = original.replace(/\s+/g, "");

  const currentUrl = window.location.href.split("#")[0];
  const urlStart = currentUrl.split("?")[0];
  const codePiece = "?code=" + encodeURIComponent(minified);

  const name = document.getElementById("nameInput").value;
  const namePiece = "&name=" + encodeURIComponent(name);

  const author = document.getElementById("authorInput").value;
  const authorPiece = "&author=" + encodeURIComponent(author);

  const license = document.getElementById("licenseInput").value;
  const licensePiece = "&license=" + encodeURIComponent(license);

  const fullUrl = urlStart + codePiece + namePiece + authorPiece + licensePiece;

  if (replace) {
    window.history.replaceState('', '', fullUrl);
  } else {
    window.history.pushState('', '', fullUrl);
  }
}


/**
 * Minify Plant code.
 *
 * @param input String containing Plant code to minify.
 * @return Minifed code or null if parsing failed.
 */
function minifyTarget(input) {
  const program = getProgram(input);

  if (!program.getWasSuccessful()) {
    return null;
  }

  const original = getSourceCode();
  const minified = original.replace(/\s+/g, "");
  return minified;
}


/**
 * Minify the code in the editor.
 */
function executeMinify() {
  const minified = minifyTarget(getSourceCode());

  if (minified === null) {
    alert("Please fix errors before minifying.");
    return;
  }

  editor.setValue(minified);
}


/**
 * Format Plant code.
 *
 * @param input String containing Plant code to beautify.
 * @return Beautified code or null if parsing failed.
 */
function beautifyTarget(input) {
  const program = getProgram(input);

  if (!program.getWasSuccessful()) {
    return null;
  }

  const components = program.getAst().accept(new BeautifyVisitor());

  let outputProgram = "";
  let indentSize = 0;
  let first = true;
  let firstAfterScopeChange = false;
  let numComponents = components.length;
  for (let i = 0; i < numComponents; i++) {
    const component = components[i];
    const commandType = component.getCommandType();

    if (indentSize < 0) {
      indentSize = 0;
    }
    
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


/**
 * Format the code in the editor.
 */
function executeBeautify() {
  const outputProgram = beautifyTarget(getSourceCode());

  if (outputProgram === null) {
    alert("Please fix errors before minifying.");
    return;
  }

  editor.setValue(outputProgram);
}


/**
 * Load the code currently contained in the URI in the address bar into editor.
 *
 * Load the code currently contained in the URI in the address bar into editor
 * along with metadata;
 */
function loadCodeFromUri() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const codeBeautified = beautifyTarget(code);

  let name = url.searchParams.get("name");
  if (name === null) {
    name = "Untitled";
  }

  let author = url.searchParams.get("author");
  if (author === null) {
    author = "unknown";
  }

  let license = url.searchParams.get("license");
  if (license === null) {
    license = "Proprietary";
  }

  setMetadata(name, author, license);

  if (codeBeautified !== null) {
    editor.setValue(codeBeautified);
  }
}


/**
 * Update code metadata.
 *
 * @param name The name of the program.
 * @param author The name of the author.
 * @param license The name of the license.
 */
function setMetadata(name, author, license) {
  document.getElementById("nameInput").value = name;
  document.getElementById("authorInput").value = author;
  document.getElementById("licenseInput").value = license;

  document.getElementById("nameDisplay").textContent = name;
  document.getElementById("authorDisplay").textContent = author;
  document.getElementById("licenseDisplay").textContent = license;

  let targetUrl = "/no_license.txt";
  let candidateUrl = LICENSE_LINKS[license];
  if (candidateUrl !== undefined) {
    targetUrl = candidateUrl;
  }
  document.getElementById("licenseLink").href = targetUrl;

  updateHistory(true);
}


/**
 * Initalize the editor.
 */
function initEditor() {
  editor = ace.edit("editor");
  editor.getSession().setUseWorker(false);

  editor.setOption("enableKeyboardAccessibility", true);

  editor.session.setOptions({
      tabSize: 2,
      useSoftTabs: true
  });

  editor.setTheme("ace/theme/monokai");
  editor.on("change", () => checkChange());
}


/**
 * Initialize other UI event listeners.
 */
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

  document.getElementById(EDIT_METADATA_ID).addEventListener("click", (e) => {
    document.getElementById(AUTHOR_EDITOR_ID).style.display = "block";
    document.getElementById(AUTHOR_INFO_ID).style.display = "none";
  });

  document.getElementById(FINISH_METADATA_ID).addEventListener("click", (e) => {
    if (!getProgram(getSourceCode()).getWasSuccessful()) {
      alert("Please fix code issues before updating metadata.");
      e.preventDefault();
      return;
    }

    const name = document.getElementById("nameInput").value;
    const author = document.getElementById("authorInput").value;
    const license = document.getElementById("licenseInput").value;

    setMetadata(name, author, license);

    document.getElementById(AUTHOR_EDITOR_ID).style.display = "none";
    document.getElementById(AUTHOR_INFO_ID).style.display = "block";
  });

  const canvas = document.getElementById(CANVAS_ID);
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, false);
}


function resetInterval() {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }

  const source = getSourceCode();
  let hasDynamic = source.includes("mouseX");
  hasDynamic = hasDynamic || source.includes("mouseY");
  hasDynamic = hasDynamic || source.includes("dur");
  hasDynamic = hasDynamic || source.includes("sin");
  hasDynamic = hasDynamic || source.includes("millis");
  hasDynamic = hasDynamic || source.includes("sec");
  hasDynamic = hasDynamic || source.includes("min");
  hasDynamic = hasDynamic || source.includes("hour");
  hasDynamic = hasDynamic || source.includes("day");
  hasDynamic = hasDynamic || source.includes("month");
  hasDynamic = hasDynamic || source.includes("year");

  if (hasDynamic) {
    intervalId = setInterval(() => { render(lastInstructions); }, 0.055);
  } else {
    intervalId = null;
    render(lastInstructions);
  }
}


/**
 * Initalize web application.
 */
function init() {
  initEditor();
  initListeners();
  loadCodeFromUri();
  resetInterval();
}


init();
