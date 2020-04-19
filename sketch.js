const randomPattern = rows =>
    [...Array(rows).keys()].map(_ => Math.floor(Math.random() + 0.5));
const state = (function() {
    const ROWS = 8;
    const RESET_EVERY = 8;
    const RULES = {
        1: [1, 0, 1],
        0: [0]
    };
    const STEPS_PER_ROW = 8;
    const MAX_STEP = ROWS * STEPS_PER_ROW;
    const KICK_EVERY = 4;

    const INIT_PATTERN = randomPattern(STEPS_PER_ROW);

    let initRule = randomPattern(STEPS_PER_ROW);
    let currentStep = 0;
    let ding;
    let kick;

    let patterns = [...Array(ROWS).keys()].map(_ =>
        [...Array(STEPS_PER_ROW).keys()].map(_ => 0)
    );
    let rule = initRule;
    let from1 = "1, 0, 1";
    let from0 = "0";
    return {
        ROWS,
        RESET_EVERY,
        RULES,
        STEPS_PER_ROW,
        MAX_STEP,
        initRule,
        KICK_EVERY,
        INIT_PATTERN,
        currentStep,
        ding,
        kick,
        patterns,
        rule,
        from1,
        from0
    };
})();
state.randomizeInitRule = _ =>
    (state.initRule = randomPattern(state.STEPS_PER_ROW));

const gui = new dat.GUI();
gui.add(state, "randomizeInitRule");
const from1Controller = gui.add(state, "from1");
const from0Controller = gui.add(state, "from0");

const onTransformationControllerChange = (num, val) => {
    const newVals = val
        .split("")
        .filter(v => v.match(/[0-9]/g))
        .map(v => parseInt(v))
        .filter(v => v === 1 || v === 0);
    console.log("new transformation: ", newVals, " for number: ", num);
    state.RULES[num] = newVals;
};
from1Controller.onChange(val => onTransformationControllerChange(1, val));
from0Controller.onChange(val => onTransformationControllerChange(0, val));

function preload() {
    soundFormats("wav");
    state.ding = loadSound("assets/hihat.wav");
    state.kick = loadSound("assets/kick.wav");
}

function setup() {
    const canvas = createCanvas(400, 600);
    canvas.style("display", "block");
    frameRate(8);
}

function updateRule(rule) {
    return rule
        .reduce((acc, el) => acc.concat(state.RULES[el]), [])
        .slice(0, state.STEPS_PER_ROW);
}

const patternToRuleIndex = pattern =>
    state.RULES[state.rule[state.rule.length - 1 - pattern]];

function generatePattern(rule, prevPattern) {
    //  111  110  101 100  011 010	001	000
    //    0	   1	1	0	 1	 1	  1	  0	    new state
    let pattern = [];
    for (let i = 0; i < prevPattern.length; i++) {
        const left =
            i - 1 < 0
                ? prevPattern[prevPattern.length - 1]
                : prevPattern[i - 1];
        const right =
            i + 1 === prevPattern.length ? prevPattern[0] : prevPattern[i + 1];
        const current = prevPattern[i];
        pattern = pattern.concat(
            patternToRuleIndex((left << 2) + (current << 1) + right)
        );
    }
    return pattern.slice(0, state.STEPS_PER_ROW);
}

function executeBinary(binary, row, y, size) {
    stroke(0);
    strokeWeight(4);
    binary.forEach((el, i) => {
        if (state.STEPS_PER_ROW * row + i === state.currentStep) {
            fill(127);
            if (el === 1) {
                state.ding.play();
            }
        } else {
            noFill();
        }
        rect(i * size, y, size, size);
        if (el === 1) {
            fill(255);
            rect(i * size + size * 0.2, y + size * 0.2, 0.6 * size, 0.6 * size);
        }
    });
}

function updateRuleAndPattern() {
    if ((frameCount - 1) % (state.RESET_EVERY * state.STEPS_PER_ROW) === 0) {
        state.rule = state.initRule;
        state.patterns = [...Array(state.ROWS).keys()].map(_ =>
            [...Array(state.STEPS_PER_ROW).keys()].map(_ => 0)
        );
        state.patterns[0] = generatePattern(state.rule, state.INIT_PATTERN);
    } else if ((frameCount - 1) % state.STEPS_PER_ROW === 0) {
        const currentStepRow = Math.floor(
            state.currentStep / state.STEPS_PER_ROW
        );
        state.rule = updateRule(state.rule);
        state.patterns[currentStepRow] = generatePattern(
            state.rule,
            state.patterns[
                currentStepRow - 1 < 0
                    ? state.patterns.length - 1
                    : currentStepRow - 1
            ]
        );
    }
}

function draw() {
    updateRuleAndPattern();
    if ((frameCount - 1) % state.KICK_EVERY === 0) {
        state.kick.play();
    }
    background(255);
    const size = width / state.STEPS_PER_ROW;
    executeBinary(state.INIT_PATTERN, -1, 0, size);
    executeBinary(state.rule, -1, size, size);

    for (let row = 0; row < state.ROWS; row++) {
        executeBinary(state.patterns[row], row, width / 2 + row * size, size);
    }

    state.currentStep += 1;
    if (state.currentStep >= state.MAX_STEP) {
        state.currentStep = 0;
    }
}

function mousePressed() {
    state.ding.play();
}
