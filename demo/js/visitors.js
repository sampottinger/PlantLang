/**
 * ANTLR visitors for compilation and code beautification.
 *
 * @author Sam Pottinger
 * @license MIT License
 */


/**
 * Visitor which compiles the Plant program to JS functions.
 *
 * Visitor which compiles the Plant program to JS functions, returning a list of
 * functions which take in a State object and can be run in series one per
 * program frame render.
 */
class CompileVisitor extends toolkit.PlantLangVisitor {

  /**
   * Visit a number node with interpretation of number modifiers.
   *
   * @return Function which takes in a State object and returns a float
   *   corresponding to number value (literal) intended by the user.
   */
  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();

    const signMultiplier = raw.includes("-") ? -1 : 1;

    const bodyRawText = ctx.getChild(ctx.getChildCount() - 1).getText();
    const bodyParsed = signMultiplier * parseFloat(bodyRawText);

    const modifiers = [];

    const iterMatches = raw.match(/(\.)*iter/g);
    if (iterMatches !== null) {
      iterMatches.forEach((match) => {
        const numLevels = self._count(match, ".");
        modifiers.push(self._makeMultiplier(
          (state) => state.getIndex(numLevels)
        ));
      });
    }

    const remainMatches = raw.match(/(\.)*remain/g);
    if (remainMatches !== null) {
      remainMatches.forEach((match) => {
        const numLevels = self._count(match, ".");
        modifiers.push(self._makeMultiplier(
          (state) => state.getRemain(numLevels)
        ));
      });
    }

    const numRand = self._count(raw, "rand");
    if (numRand > 0) {
      let randStatic = 1;

      for (let i = 0; i < numRand; i++) {
        randStatic *= Math.random();
      }

      modifiers.push(self._makeMultiplier((state) => randStatic));
    }

    const numX = self._count(raw, "mouseX");
    if (numX > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getMouseX(), numX)
      ));
    }

    const numY = self._count(raw, "mouseY");
    if (numY > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getMouseY(), numY)
      ));
    }

    const numDur = self._count(raw, "dur");
    if (numDur > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getDuration(), numDur)
      ));
    }

    const numSin = self._count(raw, "sin");
    if (numSin > 0) {
      modifiers.push(self._makeMultiplier((state) => Math.pow(
        Math.sin(state.getDuration() / Math.PI),
        numSin
      )));
    }

    const numMillis = self._count(raw, "millis");
    if (numMillis > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getMillisecond(), numMillis)
      ));
    }

    const numSec = self._count(raw, "sec");
    if (numSec > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getSecond(), numSec)
      ));
    }

    const numMin = self._count(raw, "min");
    if (numMin > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getMinute(), numMin)
      ));
    }

    const numHour = self._count(raw, "hour");
    if (numHour > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getHour(), numHour)
      ));
    }

    const numDay = self._count(raw, "day");
    if (numDay > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getDay(), numDay)
      ));
    }

    const numMonth = self._count(raw, "month");
    if (numMonth > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getMonth(), numMonth)
      ));
    }

    const numYear = self._count(raw, "year");
    if (numYear > 0) {
      modifiers.push(self._makeMultiplier(
        (state) => Math.pow(state.getYear(), numYear)
      ));
    }

    const numSqrt = self._count(raw, "sqrt");
    if (numSqrt > 0) {
      modifiers.push((state) => (operand) => Math.sqrt(operand));
    }

    return (state) => {
      let retVal = bodyParsed;

      modifiers.forEach((modifier) => {
        const realized = modifier(state);
        retVal = realized(retVal);
      });

      return retVal;
    };
  }

  /**
   * Visit expression which adds or subtracts two other expressions.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitAdditionExpression(ctx) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    const opFunc = ctx.op.text === "+" ? (a, b) => a + b : (a, b) => a - b;
    const afterExpression = ctx.getChild(2).accept(self);

    return (state) => {
      return opFunc(priorExpression(state), afterExpression(state));
    };
  }

  /**
   * Visit expression which resolves to a single number.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitSimpleExpression(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  /**
   * Visit expression which is inside parantheses.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitParenExpression(ctx) {
    const self = this;
    return ctx.getChild(1).accept(self);
  }

  /**
   * Visit expression which multiplies or divides two other expressions.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitMultiplyExpression(ctx) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    let opFunc = null;
    if (ctx.op.text === "*") {
      opFunc = (a, b) => a * b;
    } else if (ctx.op.text === "/") {
      opFunc = (a, b) => a / b;
    } else if (ctx.op.text === "^") {
      opFunc = (a, b) => Math.pow(a, b);
    }
    const afterExpression = ctx.getChild(2).accept(self);

    return (state) => {
      return opFunc(priorExpression(state), afterExpression(state));
    };
  }

  /**
   * Visit a stem node with future draw command.
   *
   * @return Array with function which takes in a State object and will cause a
   *   rectangle to be drawn and translate applied.
   */
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

  /**
   * Visit a skip node with future translate command.
   *
   * @return Array with function which takes in a State object and will cause a
   *   translate in the drawing context.
   */
  visitSkip(ctx) {
    const self = this;

    const lengthFuture = ctx.distance.accept(self);

    const futureFunc = (state) => {
      const length = lengthFuture(state);
      state.getCanvasContext().translate(0, length);
    };

    return [futureFunc];
  }

  /**
   * Visit a width node.
   *
   * @return Array with function which takes in a State object and updates the
   *   width on that state.
   */
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

  /**
   * Visit a skip node with future rotate command.
   *
   * @return Array with function which takes in a State object and will cause a
   *   rotate in the drawing context.
   */
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

  /**
   * Visit a color node with future fill color command.
   *
   * @return Array with function which takes in a State object and will cause
   *   the fill color and transparency to change in the drawing context.
   */
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

  /**
   * Visit a speed node.
   *
   * @return Array with function which takes in a State object and updates the
   *   speed settings in the current call stack location.
   */
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

  /**
   * Visit a flower node with future draw command.
   *
   * @return Array with function which takes in a State object and will cause a
   *   circle to be drawn.
   */
  visitFlower(ctx) {
    const self = this;

    const radiusFuture = ctx.radius.accept(self);

    const futureFunc = (state) => {
      const radius = radiusFuture(state);

      if (radius < 0) {
        radius = 0;
      }

      state.getCanvasContext().beginPath();
      state.getCanvasContext().arc(0, 0, radius, 0, 2 * Math.PI, false);
      state.getCanvasContext().fill();
    };

    return [futureFunc];
  }

  /**
   * Visit a branch node and traverse children.
   *
   * @return Array with function which cause multiple branches of execution.
   */
  visitBranch(ctx) {
    const self = this;

    const instructions = [];
    const numSubPrograms = (ctx.getChildCount() - 1) / 2;

    for (let i = 0; i < numSubPrograms; i++) {
      const subProgram = ctx.getChild(2 + i * 2).accept(self);
      instructions.push((state) => state.save());
      instructions.push((state) => state.setIndex(i, numSubPrograms));
      instructions.push.apply(instructions, subProgram);
      instructions.push((state) => state.restore());
    }

    return instructions;
  }

  /**
   * Visit a frac node and traverse child.
   *
   * @return Array with functions which cause multiple branches of execution.
   */
  visitFrac(ctx) {
    const self = this;

    const instructions = [];
    const numFrac = parseFloat(ctx.getChild(1).getText());

    for (let i = 0; i < numFrac; i++) {
      const subProgram = ctx.getChild(ctx.getChildCount() - 1).accept(self);
      instructions.push((state) => state.save());
      instructions.push((state) => state.setIndex(i, numFrac));
      instructions.push.apply(instructions, subProgram);
      instructions.push((state) => state.restore());
    }

    return instructions;
  }

  /**
   * Visit a loop node and traverse child.
   *
   * @return Array with functions which cause repeated executionn.
   */
  visitLoop(ctx) {
    const self = this;

    const instructions = [];
    const numFrac = parseFloat(ctx.getChild(1).getText());

    instructions.push((state) => state.save());
    for (let i = 0; i < numFrac; i++) {
      const subProgram = ctx.getChild(ctx.getChildCount() - 1).accept(self);
      instructions.push((state) => state.setIndex(i, numFrac));
      instructions.push.apply(instructions, subProgram);
    }
    instructions.push((state) => state.restore());

    return instructions;
  }

  /**
   * Visit a choose node and traverse selected children.
   *
   * @return Array with functions which cause multiple branches of execution.
   */
  visitChoose(ctx) {
    const self = this;

    const numChoose = parseFloat(ctx.getChild(1).getText());
    const chooseWithReplace = ctx.getChild(2).getText() === "replace";

    const childOffset = chooseWithReplace ? 3 : 2;
    const numSubPrograms = (ctx.getChildCount() - childOffset) / 2;

    const indicies = [];
    if (chooseWithReplace) {
      for (let i = 0; i < numChoose; i++) {
        indicies.push(Math.floor(Math.random() * numSubPrograms));
      }
    } else {
      const indexOptions = [];
      for (let i = 0; i < numSubPrograms; i++) {
        indexOptions.push(i);
      }

      indexOptions.sort((a, b) => 0.5 - Math.random());
      for (let i = 0; i < numChoose; i++) {
        const chosenIndex = indexOptions[i % indexOptions.length];
        indicies.push(chosenIndex);
      }
    }

    const instructions = [];
    indicies.forEach((i) => {
      const subProgram = ctx.getChild(childOffset + i * 2 + 1).accept(self);
      instructions.push((state) => state.save());
      instructions.push((state) => state.setIndex(i, numChoose));
      instructions.push.apply(instructions, subProgram);
      instructions.push((state) => state.restore());
    });

    return instructions;
  }

  /**
   * Visit a command node.
   *
   * @return Array with functions which execute the user's command.
   */
  visitCommand(ctx) {
    const self = this;
    const instructions = ctx.getChild(0).accept(self);

    return instructions;
  }

  /**
   * Visit a program node and all children.
   *
   * @return Array with functions which execute the user's commands.
   */
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

  /**
   * Get the number of times a substring appears in a string.
   *
   * @param target The string in which to find substrings.
   * @param match The substring to count.
   * @return Intenger count of match instances in target.
   */
  _count(target, match) {
    const self = this;
    return target.split(match).length - 1;
  }

  /**
   * Create a new future multiplier function.
   *
   * Wrap a function which returns a number when given state as a function
   * taking another number and multiplying the returned number.
   *
   * @param multiplier The function which, when given state, returns the number
   *    to multiply to the future number.
   * @return Function which when given state returns annother function taking a
   *    number and returning a number (the input number multiplied by the
   *    number given by multiplier).
   */
  _makeMultiplier(multiplier) {
    const self = this;
    return (state) => {
      return (operand) => {
        const realized = multiplier(state);
        return realized * operand;
      };
    };
  }

}


/**
 * Visitor which compiles Plant code to an intermediate format.
 *
 * Visitor which compiles Plant code to an intermediate format which can be
 * converted into a "beautified" string with formatted Plant code. This
 * specifically returns an array of CodeComponent objects.
 */
class BeautifyVisitor extends toolkit.PlantLangVisitor {

  /**
   * Format a number and its modifiers.
   *
   * @return Formatted string.
   */
  visitNumber(ctx) {
    const self = this;

    const raw = ctx.getText();

    return raw.replace(/iter\s*/g, "iter ")
      .replace(/remain\s*/g, "remain ")
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

  /**
   * Format a stem call.
   *
   * @return Array with single simple code component.
   */
  visitStem(ctx) {
    const self = this;

    const numberText = ctx.getChild(1).accept(self);
    const immediate = "stem " + numberText;

    return [new CodeComponent("simple", immediate)];
  }

  /**
   * Format a skip call.
   *
   * @return Array with single simple code component.
   */
  visitSkip(ctx) {
    const self = this;

    const numberText = ctx.getChild(1).accept(self);
    const immediate = "skip " + numberText;

    return [new CodeComponent("simple", immediate)];
  }

  /**
   * Format a width call.
   *
   * @return Array with single simple code component.
   */
  visitWidth(ctx) {
    const self = this;

    const numberText = ctx.target.accept(self);
    const immediate = "width " + numberText + " " + ctx.units.text;

    return [new CodeComponent("simple", immediate)];
  }

  /**
   * Format a rotate call.
   *
   * @return Array with single simple code component.
   */
  visitRotate(ctx) {
    const self = this;

    const numberText = ctx.target.accept(self);
    const immediate = "rotate " + numberText + " " + ctx.units.text;

    return [new CodeComponent("simple", immediate)];
  }

  /**
   * Format a color call.
   *
   * @return Array with single simple code component.
   */
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

  /**
   * Visit expression which adds or subtracts two other expressions.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitAdditionExpression(ctx) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    const afterExpression = ctx.getChild(2).accept(self);

    return priorExpression + " " + ctx.op.text + " " + afterExpression;
  }

  /**
   * Visit expression which resolves to a single number.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitSimpleExpression(ctx) {
    const self = this;
    return ctx.getChild(0).accept(self);
  }

  /**
   * Visit expression which is inside parantheses.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitParenExpression(ctx) {
    const self = this;
    return "(" + ctx.getChild(1).accept(self) + ")";
  }

  /**
   * Visit expression which multiplies or divides two other expressions.
   *
   * @return Function which takes in a State object and returns a float.
   */
  visitMultiplyExpression(ctx) {
    const self = this;

    const priorExpression = ctx.getChild(0).accept(self);
    const afterExpression = ctx.getChild(2).accept(self);

    return priorExpression + " " + ctx.op.text + " " + afterExpression;
  }

  /**
   * Format a speed call.
   *
   * @return Array with single simple code component.
   */
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

  /**
   * Format a flower call.
   *
   * @return Array with single simple code component.
   */
  visitFlower(ctx) {
    const self = this;

    const numberText = ctx.radius.accept(self);
    const immediate = "flower " + numberText;

    return [new CodeComponent("simple", immediate)];
  }

  /**
   * Format a branch call.
   *
   * @return Array with multiple components.
   */
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

  /**
   * Format a frac call.
   *
   * @return Array with multiple components.
   */
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

  /**
   * Format a loop call.
   *
   * @return Array with multiple components.
   */
  visitLoop(ctx) {
    const self = this;

    const immediate = "loop " + ctx.getChild(1).getText();
    const allCommands = [new CodeComponent("branch", immediate)];
    const subProgram = ctx.getChild(3).accept(self);
    allCommands.push(new CodeComponent("subBranchStart", ""));
    allCommands.push.apply(allCommands, subProgram);
    allCommands.push(new CodeComponent("end", ""));
    allCommands.push(new CodeComponent("subBranchEnd", ""));

    return allCommands;
  }

  /**
   * Format a choose call.
   *
   * @return Array with multiple components.
   */
  visitChoose(ctx) {
    const self = this;

    const chooseWithReplace = ctx.getChild(2).getText() === "replace";

    const immediate = "choose " + ctx.getChild(1).getText();
    const replaceText = chooseWithReplace ? " replace " : "";
    const allCommands = [new CodeComponent("branch", immediate + replaceText)];

    const childOffset = chooseWithReplace ? 3 : 2;
    const numSubPrograms = (ctx.getChildCount() - childOffset) / 2;
    for (let i = 0; i < numSubPrograms; i++) {
      const subProgram = ctx.getChild(childOffset + i * 2 + 1).accept(self);
      allCommands.push(new CodeComponent("subBranchStart", ""));
      allCommands.push.apply(allCommands, subProgram);
      allCommands.push(new CodeComponent("end", ""));
      allCommands.push(new CodeComponent("subBranchEnd", ""));
    }

    return allCommands;
  }

  /**
   * Format a command.
   *
   * @return Array of components.
   */
  visitCommand(ctx) {
    const self = this;
    const instructions = ctx.getChild(0).accept(self);

    return instructions;
  }

  /**
   * Format a program.
   *
   * @return Array of components.
   */
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
