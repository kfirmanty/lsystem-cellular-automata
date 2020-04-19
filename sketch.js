const state = (function() {
    const ROWS = 8;
    const RESET_EVERY = 8;
    const RULES = {
        1: [0, 1],
        0: [1, 1, 0]
    };
    const STEPS_PER_ROW = 8;
    const MAX_STEP = ROWS * STEPS_PER_ROW;
    const INIT_PATTERN = [...Array(ROWS).keys()].map(_ =>
        Math.floor(Math.random() + 0.5)
    );

    let currentStep = 0;
    let ding;

    let patterns = [...Array(ROWS).keys()].map(_ =>
        [...Array(STEPS_PER_ROW).keys()].map(_ => 0)
    );
    let rule = INIT_PATTERN;
    return {
        ROWS,
        RESET_EVERY,
        RULES,
        STEPS_PER_ROW,
        MAX_STEP,
        INIT_PATTERN,
        currentStep,
        ding,
        patterns,
        rule
    };
})();

const gui = new dat.GUI();
//gui.add(state, "INIT_PATTERN");

function preload() {
    soundFormats("wav");
    state.ding = loadSound("assets/hihat.wav");
}

function setup() {
    createCanvas(400, 600);
    frameRate(8);
}

function updateRule(rule) {
    console.log("UPDATING RULE:", rule);
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
    binary.forEach((el, i) => {
        if (state.STEPS_PER_ROW * row + i === state.currentStep) {
            fill(255, 0, 0);
            if (el === 1) {
                state.ding.play();
            }
        } else if (el === 1) {
            fill(0, 255, 0);
        } else {
            noFill(0);
        }
        rect(i * size, y, size, size);
    });
}

function draw() {
    if ((frameCount - 1) % (state.RESET_EVERY * state.STEPS_PER_ROW) === 0) {
        console.log("RESETTING PATTERN");
        state.rule = state.INIT_PATTERN;
        state.patterns = [...Array(state.ROWS).keys()].map(_ =>
            [...Array(state.STEPS_PER_ROW).keys()].map(_ => 0)
        );
        state.patterns[0] = generatePattern(
            state.rule,
            state.patterns[state.patterns.length - 1]
        );
    } else if ((frameCount - 1) % state.STEPS_PER_ROW === 0) {
        //console.log("UPDATING RULE AND PATTERN PATTERN");
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
    background(255);
    const size = width / state.STEPS_PER_ROW;
    executeBinary(state.rule, -1, 0, size);

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
