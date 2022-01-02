/**
 * Data structures for the online Plant editor.
 *
 * @author Sam Pottinger
 * @license MIT License
 */


/**
 * Record describing the results of attempting to parse a Plant program.
 */
class ParseResult {

  /**
   * Create a new parse result record.
   *
   * @param ast The ANTLR abstract syntax tree or null if program failed parse.
   * @param errors Array of strings describing compilation errors.
   */
  constructor(ast, errors) {
    const self = this;
    self._ast = ast;
    self._errors = errors;
  }

  /**
   * Get the abstract syntax tree.
   *
   * @return The ANTLR abstract syntax tree or null if program failed parse.
   */
  getAst() {
    const self = this;
    return self._ast;
  }

  /**
   * Get the errors (if any) found during pasring.
   *
   * @return Array of strings describing parsing errors.
   */
  getErrors() {
    const self = this;
    return self._errors;
  }

  /**
   * Determine if parsing was successful.
   *
   * @return True if error free and false otherwise.
   */
  getWasSuccessful() {
    const self = this;
    return self._errors.length == 0;
  }

}


/**
  * Structure which defines how "duration" should work.
  *
  * Structure which defines how "duration" should work, changing the speed of
  * animations via the duration and sin number modifiers. This does not impact
  * date number modifiers.
  */
class SpeedSettings {

  /**
   * Create a new speed settings record.
   *
   * @param multiplier Mulitiplier to multiply to duration. 1 means that sin
   *   have a full cycle every 2 seconds, 2 means it will have one every 1
   *   second.
   * @param offset Offset to add to duration. This is effectivley the
   *   "starting" duration where 0 means that the simulation starts at 0
   *   seconds and 1 means the simulation starts at 1 second.
   */
  constructor(multiplier, offset) {
    const self = this;
    self._multiplier = multiplier;
    self._offset = offset;
  }

  /**
   * Get the multiplier to use for duration.
   *
   * Get the multiplier duration. For example, 1 means that sin have a full
   * cycle every 2 seconds, 2 means it will have one every 1 second.
   * Alternatively, 1 neans duration will refer to number of seconds since
   * starting and 1000 means duration will refer to the number of milliseconds
   * since starting.
   *
   * @return Multiplier to multiply real clock duration by before returning
   *   to program.
   */
  getMultiplier() {
    const self = this;
    return self._multiplier;
  }

  /**
   * Get the starting duration in seconds.
   *
   * @return The starting duration in seconds. Note that this is added after
   *   applying the multiplier.
   */
  getOffset() {
    const self = this;
    return self._offset;
  }

}

/**
 * Record describing current program state.
 */
class State {

  /**
   * Create a new state record.
   *
   * @param canvas HTML canvas element where program draws.
   * @param canvasContext The 2d drawing context for the canvas.
   * @param mouseX Horizontal pixel position of mouse relative to canvas
   *   position.
   * @param mouseY Vertical pixel position of mouse relative to canvas
   *   position.
   * @param duration The number of seconds since program started drawing. Note
   *   that program edits reset duration.
   * @param curDate The JS date object corresponding to current date in client
   *   timezone.
   */
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

  /**
   * Get the canvas where the program is running.
   *
   * @return HTML canvas element where program draws.
   */
  getCanvas() {
    const self = this;
    return self._canvas;
  }

  /**
   * Get the drawing context for the program canvas.
   *
   * @return The 2d drawing context for the canvas.
   */
  getCanvasContext() {
    const self = this;
    return self._canvasContext;
  }

  /**
   * Get the branch index at the given level.
   *
   * @param levels How many levels in the call stack to traverse upwards. This
   *   corresponds to the number of periods before iter.
   * @return Zero indexed branch index.
   */
  getIndex(levels) {
    const self = this;
    if (levels >= self._indicies.length) {
      return 0;
    } else {
      return self._indicies[self._indicies.length - 1 - levels];
    }
  }

  /**
   * Set the new index at the current call stack position.
   *
   * @param index The new integer branch index.
   */
  setIndex(index) {
    const self = this;
    self._indicies[self._indicies.length - 1] = index;
  }

  /**
   * Get the current drawing width in pixels.
   *
   * @return Drawing width in pixels.
   */
  getWidth() {
    const self = this;
    return self._widths[self._widths.length - 1];
  }

  /**
   * Set the current drawing width in pixels.
   *
   * @param newWidth Drawing width in pixels.
   */
  setWidth(newWidth) {
    const self = this;
    self._widths[self._widths.length - 1] = newWidth;
  }

  /**
   * Get canvas relative mouse horizontal position.
   *
   * @return Horizontal pixel position of mouse relative to canvas position.
   */
  getMouseX() {
    const self = this;
    return self._mouseX;
  }

  /**
   * Get canvas relative mouse vertical position.
   *
   * @return Vertical pixel position of mouse relative to canvas position.
   */
  getMouseY() {
    const self = this;
    return self._mouseY;
  }

  /**
   * Get for how long the program has been running.
   *
   * @return Seconds since program start with speed adjustments applied. Note
   *  that modifications made to program after start cause duration to reset.
   */
  getDuration() {
    const self = this;

    const speedSettings = self.getSpeedSettings();
    const multiplier = speedSettings.getMultiplier();
    const offset = speedSettings.getOffset();

    return self._duration * multiplier + offset;
  }

  /**
   * Get JS date millisecond.
   *
   * @return Milliseconds of second in user timezone. Zero indexed.
   */
  getMillisecond() {
    const self = this;
    return self._curDate.getMilliseconds();
  }

  /**
   * Get JS date second.
   *
   * @return Second of minute in user timezone. Zero indexed.
   */
  getSecond() {
    const self = this;
    return self._curDate.getSeconds();
  }

  /**
   * Get JS date minute.
   *
   * @return Minute of hour in user timezone. Zero indexed.
   */
  getMinute() {
    const self = this;
    return self._curDate.getMinutes();
  }

  /**
   * Get JS date hour.
   *
   * @return Hour of day in user timezone. Zero indexed.
   */
  getHour() {
    const self = this;
    return self._curDate.getHours();
  }

  /**
   * Get JS date day.
   *
   * @return Day of month in user timezone. Zero indexed.
   */
  getDay() {
    const self = this;
    return self._curDate.getDate() - 1;
  }

  /**
   * Get JS date month.
   *
   * @return Month of year in user timezone. Zero indexed.
   */
  getMonth() {
    const self = this;
    return self._curDate.getMonth();
  }

  /**
   * Get JS date year.
   *
   * @return Absolute year in user timezone.
   */
  getYear() {
    const self = this;
    return self._curDate.getYear();
  }

  /**
   * Get the current speed settings at location on call stack.
   *
   * @return Current stack location speed settings.
   */
  getSpeedSettings() {
    const self = this;
    return self._speeds[self._speeds.length - 1];
  }

  /**
   * Update the current speed settings at location on call stack.
   *
   * @param newSpeedSettings Speed settings to use at stack location.
   */
  setSpeedSettings(newSpeedSettings) {
    const self = this;
    self._speeds[self._speeds.length - 1] = newSpeedSettings;
  }

  /**
   * Save and push the current stack state.
   *
   * Save and push the current stack state like when going into branch or frac
   * command. This causes branch index, width, and speed to get pushed so that
   * they are restored when the branch finishes.
   */
  save() {
    const self = this;

    self.getCanvasContext().save();
    self._indicies.push(self.getIndex(0));
    self._widths.push(self.getWidth());
    self._speeds.push(self.getSpeedSettings());
  }

  /**
   * Pop the stack state.
   *
   * Pop the stack state like at the end of the branch or frac (encounter ;).
   * This causes all changes to branch index, width, and speed to get undone
   * as the parent branch continues.
   */
  restore() {
    const self = this;

    self.getCanvasContext().restore();
    self._indicies.pop();
    self._widths.pop();
    self._speeds.pop();
  }

}


/**
 * Structure describing a piece of code for beautification.
 */
class CodeComponent {

  /**
   * Create new code component.
   *
   * @param commandType Type of code component like simple.
   * @param command The text of the command / code component.
   */
  constructor(commandType, command) {
    const self = this;
    self._commandType = commandType;
    self._command = command;
  }

  /**
   * Get the type of code component.
   *
   * @return Type of code component like simple.
   */
  getCommandType() {
    const self = this;
    return self._commandType;
  }

  /**
   * Get the body of the code component.
   *
   * @return The text of the command / code component.
   */
  getCommand() {
    const self = this;
    return self._command;
  }

}
