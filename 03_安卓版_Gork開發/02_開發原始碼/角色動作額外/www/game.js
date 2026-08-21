"use strict";
const ACTION_CLASSES = ["acting-place", "acting-skip", "acting-cap", "acting-push", "acting-stamp"];
const ACTION_MS = {
    place: 500,
    skip: 400,
    cap: 440,
    push: 520,
    stamp: 360,
};
const STATIONS = ["base", "fill", "player", "inspector"];
class CharacterActionDirector {
    constructor() {
        this.timers = new Map();
    }
    play(station, action, durationMs = ACTION_MS[action]) {
        const element = document.querySelector(`#worker-${station}`);
        if (!element)
            return;
        ACTION_CLASSES.forEach((className) => element.classList.remove(className));
        void element.getBoundingClientRect();
        element.classList.add(`acting-${action}`);
        const previous = this.timers.get(station);
        if (previous)
            window.clearTimeout(previous);
        const timeoutId = window.setTimeout(() => {
            element.classList.remove(`acting-${action}`);
            this.timers.delete(station);
        }, durationMs);
        this.timers.set(station, timeoutId);
    }
    setAnticipating(station, on) {
        var _a;
        (_a = document.querySelector(`#worker-${station}`)) === null || _a === void 0 ? void 0 : _a.classList.toggle("anticipating", on);
    }
    clear() {
        this.timers.forEach((id) => window.clearTimeout(id));
        this.timers.clear();
        STATIONS.forEach((station) => {
            const element = document.querySelector(`#worker-${station}`);
            if (!element)
                return;
            ACTION_CLASSES.forEach((className) => element.classList.remove(className));
            element.classList.remove("anticipating");
        });
    }
}
const BURGER_VISUAL_CONTRACT = {
    spawned: { assembly: "base", needsReturn: false, label: "漢堡底座，等待配料" },
    "base-only": { assembly: "base", needsReturn: true, label: "缺料漢堡，請退回" },
    filled: { assembly: "open", needsReturn: false, label: "待封蓋漢堡，請完成" },
    capped: { assembly: "closed", needsReturn: false, label: "已封蓋漢堡" },
    returning: { assembly: "base", needsReturn: true, label: "缺料漢堡，正在退回" },
    rework: { assembly: "base", needsReturn: true, label: "缺料漢堡，正在補料" },
};
const FOOD_STATE_TRANSITIONS = {
    spawned: ["base-only"],
    "base-only": ["base-only", "filled", "returning"],
    filled: ["capped"],
    capped: [],
    returning: ["rework"],
    rework: ["base-only", "filled"],
};
function visualContractForFood(food) {
    const contract = BURGER_VISUAL_CONTRACT[food.state];
    if (food.state === "base-only" && !food.ingredientProcessed) {
        return { assembly: "base", needsReturn: false, label: "漢堡底座，正在配料" };
    }
    return contract;
}
function shouldShowTutorialMissingGuide(food) {
    return (food.tutorial &&
        food.ingredientProcessed &&
        (food.state === "base-only" || food.state === "returning" || food.state === "rework"));
}
const SVG_NS = "http://www.w3.org/2000/svg";
const STORAGE_KEY = "factoryRush.save";
const TUTORIAL_VERSION = 2;
const START_SPEED = 145;
const SCORE_SPEED_STEP = 2.2;
const TEN_SCORE_BONUS = 4;
const MAX_SPEED = 485;
const BASE_GAP = 205;
const RUSH_START_SCORE = 40;
const RUSH_FULL_SCORE = 120;
const RUSH_START_RATE = 0.05;
const RUSH_MAX_RATE = 0.18;
const RUSH_COOLDOWN_SPAWNS = 2;
const RUSH_GAP_RATIO = 0.5;
const RUSH_VISUAL_CLEARANCE = 18;
const ACTION_LEAD = 52;
const DEFECT_RATE = 0.18;
const INPUT_LOCK_MS = 42;
const REWORK_MS = 210;
const COUNTDOWN_STEP_MS = 650;
const MAX_FRAME_SECONDS = 1 / 30;
const FAILURE_REACTION_MS = 1200;
const REDUCED_MOTION_FAILURE_MS = 120;
const SPEED_MILESTONES = [10, 25, 50, 75, 100, 150, 200];
const PAD_MINI_LONG_PIXELS = 3008;
const PAD_MINI_SHORT_PIXELS = 1880;
function required(selector) {
    const element = document.querySelector(selector);
    if (!element)
        throw new Error(`Missing required element: ${selector}`);
    return element;
}
function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}
function advanceSpawnLattice(progress, distance, gap) {
    const next = progress + Math.max(0, distance);
    if (next < gap)
        return { progress: next, overflow: null };
    const overflow = next - gap;
    return { progress: overflow, overflow };
}
function rewindSpawnLattice(progress, distance) {
    return progress - Math.max(0, distance);
}
function rescaleSpawnLattice(progress, previousGap, nextGap) {
    return progress * (nextGap / Math.max(1, previousGap));
}
function conveyorSpeedForScore(score) {
    const safeScore = Math.max(0, score);
    const uncapped = START_SPEED + safeScore * SCORE_SPEED_STEP + Math.floor(safeScore / 10) * TEN_SCORE_BONUS;
    return Math.min(Math.round(uncapped * 10) / 10, MAX_SPEED);
}
function rushPairRateForScore(score) {
    if (score < RUSH_START_SCORE)
        return 0;
    const progress = clamp((score - RUSH_START_SCORE) / Math.max(1, RUSH_FULL_SCORE - RUSH_START_SCORE), 0, 1);
    return RUSH_START_RATE + (RUSH_MAX_RATE - RUSH_START_RATE) * progress;
}
function nextSpawnGapDecision(score, normalGap, rushGap, cooldown, randomValue) {
    const safeNormalGap = Math.max(1, normalGap);
    if (cooldown > 0) {
        return { gap: safeNormalGap, cooldown: cooldown - 1, rush: false };
    }
    const rush = randomValue < rushPairRateForScore(score);
    return {
        gap: rush ? clamp(rushGap, 1, safeNormalGap) : safeNormalGap,
        cooldown: rush ? RUSH_COOLDOWN_SPAWNS : 0,
        rush,
    };
}
function stationRatiosForOrientation(portrait) {
    const base = portrait ? 0.09 : 0.08;
    const inspector = 1 - base;
    const spacing = (inspector - base) / 3;
    return {
        base,
        fill: base + spacing,
        player: base + spacing * 2,
        inspector,
    };
}
function failureReactionDelay(prefersReducedMotion) {
    return prefersReducedMotion ? REDUCED_MOTION_FAILURE_MS : FAILURE_REACTION_MS;
}
function svgElement(name) {
    return document.createElementNS(SVG_NS, name);
}
function svgNode(name, className, attributes) {
    const element = svgElement(name);
    if (className)
        element.setAttribute("class", className);
    Object.entries(attributes).forEach(([attribute, value]) => {
        element.setAttribute(attribute, String(value));
    });
    return element;
}
function near(value, target, tolerance) {
    return Math.abs(value - target) <= tolerance;
}
function sortedDimensions(width, height) {
    return [Math.max(width, height), Math.min(width, height)];
}
function isXiaomiPadMiniDisplay(width, height) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const profileOverride = new URLSearchParams(window.location.search).get("profile") === "xiaomi-pad-mini";
    const screenCandidates = [
        sortedDimensions(window.screen.width * dpr, window.screen.height * dpr),
        sortedDimensions(width * dpr, height * dpr),
        sortedDimensions(window.screen.width, window.screen.height),
    ];
    const modelMatch = /Xiaomi Pad Mini|25079RPDCG/i.test(window.navigator.userAgent);
    const resolutionMatch = screenCandidates.some(([longSide, shortSide]) => near(longSide, PAD_MINI_LONG_PIXELS, 180) &&
        near(shortSide, PAD_MINI_SHORT_PIXELS, 140));
    return profileOverride || modelMatch || resolutionMatch;
}
class SaveStore {
    constructor() {
        this.data = this.load();
    }
    load() {
        const fallback = {
            saveVersion: 2,
            bestScore: 0,
            mute: false,
            tutorialCompleted: false,
            tutorialVersion: TUTORIAL_VERSION,
        };
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw)
                return fallback;
            const parsed = JSON.parse(raw);
            return Object.assign(Object.assign(Object.assign({}, fallback), parsed), { bestScore: Math.max(0, Number(parsed.bestScore) || 0), mute: Boolean(parsed.mute), tutorialCompleted: Boolean(parsed.tutorialCompleted) && Number(parsed.tutorialVersion) === TUTORIAL_VERSION, tutorialVersion: TUTORIAL_VERSION });
        }
        catch (_a) {
            return fallback;
        }
    }
    persist() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        }
        catch (_a) {
        }
    }
    get value() {
        return this.data;
    }
    setBestScore(score) {
        if (score <= this.data.bestScore)
            return;
        this.data.bestScore = score;
        this.persist();
    }
    setMuted(muted) {
        this.data.mute = muted;
        this.persist();
    }
    completeTutorial() {
        this.data.tutorialCompleted = true;
        this.data.tutorialVersion = TUTORIAL_VERSION;
        this.persist();
    }
}
class RandomSource {
    constructor(seedSalt = 0) {
        const seedValue = new URLSearchParams(window.location.search).get("seed");
        const parsed = seedValue === null ? Number.NaN : Number(seedValue);
        const baseSeed = Number.isFinite(parsed) ? parsed : Date.now() ^ Math.floor(Math.random() * 0xffffffff);
        this.state = (baseSeed ^ seedSalt) >>> 0;
        if (this.state === 0)
            this.state = 0x6d2b79f5;
    }
    next() {
        let value = (this.state += 0x6d2b79f5);
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    }
}
class GameAudio {
    constructor(muted) {
        this.sounds = new Map();
        this.muted = muted;
        this.bgm = this.makeAudio("./audio/factory-rush-bgm.mp3", true, 0.32);
        const effects = [
            ["finish", "./audio/finish.wav", 0.68],
            ["return", "./audio/return.wav", 0.72],
            ["approved", "./audio/approved.wav", 0.58],
            ["speedup", "./audio/speedup.wav", 0.64],
            ["fail", "./audio/fail.wav", 0.7],
            ["button", "./audio/button.wav", 0.55],
        ];
        effects.forEach(([name, path, volume]) => this.sounds.set(name, this.makeAudio(path, false, volume)));
        this.applyMutedState();
    }
    makeAudio(path, loop, volume) {
        const audio = new Audio(path);
        audio.preload = "auto";
        audio.loop = loop;
        audio.volume = volume;
        return audio;
    }
    applyMutedState() {
        this.bgm.muted = this.muted;
        this.sounds.forEach((sound) => {
            sound.muted = this.muted;
        });
    }
    unlock() {
        if (this.muted)
            return;
        const button = this.sounds.get("button");
        if (button) {
            button.currentTime = 0;
            void button.play().catch(() => undefined);
        }
    }
    startMusic() {
        if (this.muted)
            return;
        void this.bgm.play().catch(() => undefined);
    }
    pauseMusic() {
        this.bgm.pause();
    }
    play(name) {
        if (this.muted)
            return;
        const sound = this.sounds.get(name);
        if (!sound)
            return;
        sound.currentTime = 0;
        void sound.play().catch(() => undefined);
    }
    toggle() {
        this.muted = !this.muted;
        this.applyMutedState();
        if (this.muted)
            this.pauseMusic();
        else
            this.startMusic();
        return this.muted;
    }
    get isMuted() {
        return this.muted;
    }
}
class VectorBurgerFactory {
    constructor() {
        this.app = required("#app");
        this.stage = required("#factory-stage");
        this.foodsLayer = required("#foods");
        this.effectsLayer = required("#effects");
        this.rollersLayer = required("#rollers");
        this.lampsLayer = required("#status-lamps");
        this.hud = required("#hud");
        this.touchZones = required("#touch-zones");
        this.cue = required("#cue");
        this.cueStep = required("#cue-step");
        this.cueTitle = required("#cue-title");
        this.cueDetail = required("#cue-detail");
        this.countdown = required("#countdown");
        this.toast = required("#toast");
        this.menu = required("#menu");
        this.pauseOverlay = required("#pause-overlay");
        this.gameOverOverlay = required("#gameover-overlay");
        this.scoreText = required("#score");
        this.speedText = required("#speed");
        this.bestScoreText = required("#best-score");
        this.finalScoreText = required("#final-score");
        this.finalBestText = required("#final-best");
        this.failureTitle = required("#failure-title");
        this.failureDetail = required("#failure-detail");
        this.muteButton = required("#mute-button");
        this.renderNote = required("#render-note");
        this.store = new SaveStore();
        this.random = new RandomSource();
        this.rushRandom = new RandomSource(0x9e3779b9);
        this.audio = new GameAudio(this.store.value.mute);
        this.actions = new CharacterActionDirector();
        this.foods = [];
        this.mode = "menu";
        this.modeBeforePause = "playing";
        this.score = 0;
        this.nextFoodId = 1;
        this.spawnDistance = 0;
        this.nextSpawnGap = BASE_GAP;
        this.nextSpawnIsRush = false;
        this.rushCooldownSpawns = 0;
        this.lastFrame = performance.now();
        this.lastInputAt = -Infinity;
        this.activePointerId = null;
        this.transitionToken = 0;
        this.tutorialStage = 0;
        this.tutorialTransitionAt = 0;
        this.returnFood = null;
        this.returnRemaining = 0;
        this.returnPhase = "rewind";
        this.reworkReadyAt = 0;
        this.returnOriginMode = "playing";
        this.failureTimeoutId = null;
        this.layout = this.calculateLayout();
        this.nextSpawnGap = this.layout.gap;
        this.bindControls();
        this.applyLayout();
        this.updateMuteButton();
        this.bestScoreText.textContent = String(this.store.value.bestScore);
        this.renderHud();
        requestAnimationFrame((time) => this.frame(time));
    }
    bindControls() {
        const bindButton = (selector, callback) => {
            const button = required(selector);
            button.addEventListener("pointerdown", (event) => {
                event.stopPropagation();
            });
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                this.audio.unlock();
                this.audio.play("button");
                callback();
            });
        };
        bindButton("#start-button", () => {
            this.menu.classList.add("hidden");
            this.audio.startMusic();
            if (this.store.value.tutorialCompleted)
                this.startCountdown();
            else
                this.startTutorial();
        });
        bindButton("#tutorial-button", () => {
            this.menu.classList.add("hidden");
            this.audio.startMusic();
            this.startTutorial();
        });
        bindButton("#pause-button", () => this.pauseGame());
        bindButton("#resume-button", () => this.resumeGame());
        bindButton("#quit-button", () => this.showMenu());
        bindButton("#retry-button", () => this.startCountdown());
        bindButton("#gameover-menu-button", () => this.showMenu());
        bindButton("#mute-button", () => {
            const muted = this.audio.toggle();
            this.store.setMuted(muted);
            this.updateMuteButton();
        });
        this.app.addEventListener("pointerdown", (event) => this.handlePointer(event), { passive: false });
        window.addEventListener("pointerup", (event) => this.releasePointer(event));
        window.addEventListener("pointercancel", (event) => this.releasePointer(event));
        this.app.addEventListener("contextmenu", (event) => event.preventDefault());
        window.addEventListener("resize", () => {
            const previous = this.layout;
            this.layout = this.calculateLayout();
            this.reflowFoods(previous, this.layout);
            this.applyLayout();
        });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden)
                this.pauseFromNative();
        });
        window.addEventListener("blur", () => this.pauseFromNative());
        window.TianyangApp = { pauseFromNative: () => this.pauseFromNative() };
    }
    calculateLayout() {
        const width = Math.max(320, window.innerWidth);
        const height = Math.max(320, window.innerHeight);
        const portrait = height >= width;
        const xiaomiPadMini = isXiaomiPadMiniDisplay(width, height);
        const tablet = xiaomiPadMini || Math.min(width, height) >= 600;
        const referenceWidth = portrait ? 390 : 844;
        const referenceHeight = portrait ? 844 : 390;
        const scale = clamp(Math.min(width / referenceWidth, height / referenceHeight), 0.82, 1.45);
        const motionScale = clamp(width / referenceWidth, 0.86, 1.7);
        const workerScale = scale * (portrait ? 0.68 : 0.7);
        const foodScale = scale * 0.82;
        const conveyorY = height * (portrait ? 0.56 : 0.61);
        const conveyorHeight = 72 * scale;
        const stations = stationRatiosForOrientation(portrait);
        const baseX = width * stations.base;
        const fillX = width * stations.fill;
        const playerX = width * stations.player;
        const inspectorX = width * stations.inspector;
        const deadlineX = inspectorX + 22 * scale;
        const actionStartX = playerX - ACTION_LEAD * scale;
        const tabletGap = deadlineX - actionStartX + 18 * scale;
        const gap = tablet ? Math.max(BASE_GAP * motionScale, tabletGap) : BASE_GAP * motionScale;
        const minimumRushGap = 116 * foodScale + RUSH_VISUAL_CLEARANCE * scale;
        const rushGap = Math.min(gap, Math.max(gap * RUSH_GAP_RATIO, minimumRushGap));
        return {
            width,
            height,
            portrait,
            tablet,
            xiaomiPadMini,
            scale,
            workerScale,
            foodScale,
            motionScale,
            conveyorY,
            conveyorHeight,
            foodY: conveyorY - 9 * foodScale,
            spawnX: -100 * foodScale,
            baseX,
            fillX,
            playerX,
            inspectorX,
            deadlineX,
            gap,
            rushGap,
        };
    }
    applyLayout() {
        const layout = this.layout;
        this.app.classList.toggle("tablet", layout.tablet);
        this.app.classList.toggle("xiaomi-pad-mini", layout.xiaomiPadMini);
        this.stage.dataset.profile = layout.xiaomiPadMini
            ? "xiaomi-pad-mini-3008x1880"
            : layout.tablet
                ? "android-tablet"
                : "android-phone";
        this.renderNote.innerHTML = layout.xiaomiPadMini
            ? "<span>◆</span> Xiaomi Pad Mini 3K 專用適配"
            : "<span>◆</span> SVG＋HTML 向量高清渲染";
        this.stage.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
        this.stage.dataset.orientation = layout.portrait ? "portrait" : "landscape";
        this.stage.dataset.layout = `${Math.round(layout.width)}x${Math.round(layout.height)}`;
        required("#wall-tint").setAttribute("width", String(layout.width));
        required("#wall-tint").setAttribute("height", String(layout.height));
        const pipeY = 92 * layout.scale;
        const pipePath = `M${-20 * layout.scale} ${pipeY} H${layout.width * 0.42} Q${layout.width * 0.47} ${pipeY} ${layout.width * 0.47} ${pipeY + 55 * layout.scale} V${pipeY + 82 * layout.scale} H${layout.width + 20 * layout.scale}`;
        required("#top-pipe").setAttribute("d", pipePath);
        required("#top-pipe-highlight").setAttribute("d", pipePath);
        const workerY = layout.conveyorY - layout.conveyorHeight * 0.5 - 70 * layout.scale;
        const workerScale = layout.workerScale * (layout.width < 370 ? 0.9 : 1);
        this.placeGroup("#worker-base", layout.baseX, workerY, workerScale);
        this.placeGroup("#worker-fill", layout.fillX, workerY, workerScale);
        this.placeGroup("#worker-player", layout.playerX, workerY, workerScale * 1.04);
        this.placeGroup("#worker-inspector", layout.inspectorX, workerY, workerScale);
        const guideY = layout.foodY - 22 * layout.scale;
        this.placeGuide("#guide-base", layout.baseX, guideY);
        this.placeGuide("#guide-fill", layout.fillX, guideY);
        this.placeGuide("#guide-player", layout.playerX, guideY);
        this.placeGuide("#guide-inspector", layout.inspectorX, guideY);
        this.layoutConveyor();
        this.renderStatusLamps();
        this.foods.forEach((food) => this.renderFoodPosition(food));
    }
    placeGroup(selector, x, y, scale) {
        required(selector).setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
    }
    placeGuide(selector, x, y) {
        required(selector).setAttribute("transform", `translate(${x} ${y}) scale(${this.layout.scale * 0.78})`);
    }
    layoutConveyor() {
        const { width, conveyorY, conveyorHeight, scale } = this.layout;
        const shadow = required("#belt-shadow");
        const frame = required("#belt-frame");
        const surface = required("#belt-surface");
        const hazard = required("#belt-hazard");
        const ticks = required("#belt-ticks");
        shadow.setAttribute("x", String(-10 * scale));
        shadow.setAttribute("y", String(conveyorY + 18 * scale));
        shadow.setAttribute("width", String(width + 20 * scale));
        shadow.setAttribute("height", String(conveyorHeight));
        frame.setAttribute("x", String(-8 * scale));
        frame.setAttribute("y", String(conveyorY - conveyorHeight * 0.5));
        frame.setAttribute("width", String(width + 16 * scale));
        frame.setAttribute("height", String(conveyorHeight));
        surface.setAttribute("x", String(-4 * scale));
        surface.setAttribute("y", String(conveyorY - conveyorHeight * 0.39));
        surface.setAttribute("width", String(width + 8 * scale));
        surface.setAttribute("height", String(conveyorHeight * 0.55));
        ticks.setAttribute("x1", "0");
        ticks.setAttribute("x2", String(width));
        ticks.setAttribute("y1", String(conveyorY - conveyorHeight * 0.11));
        ticks.setAttribute("y2", String(conveyorY - conveyorHeight * 0.11));
        hazard.setAttribute("x", "0");
        hazard.setAttribute("y", String(conveyorY + conveyorHeight * 0.32));
        hazard.setAttribute("width", String(width));
        hazard.setAttribute("height", String(13 * scale));
        this.rollersLayer.replaceChildren();
        const rollerY = conveyorY + conveyorHeight * 0.18;
        const spacing = 64 * scale;
        for (let x = 30 * scale; x < width; x += spacing) {
            const roller = svgElement("circle");
            roller.setAttribute("cx", String(x));
            roller.setAttribute("cy", String(rollerY));
            roller.setAttribute("r", String(15 * scale));
            roller.setAttribute("fill", "#152630");
            roller.setAttribute("stroke", "#7595a5");
            roller.setAttribute("stroke-width", String(3 * scale));
            this.rollersLayer.append(roller);
        }
    }
    renderStatusLamps() {
        this.lampsLayer.replaceChildren();
        const y = Math.max(120 * this.layout.scale, this.layout.conveyorY * 0.35);
        [this.layout.baseX, this.layout.fillX, this.layout.playerX, this.layout.inspectorX].forEach((x, index) => {
            const group = svgElement("g");
            group.setAttribute("transform", `translate(${x} ${y}) scale(${this.layout.scale})`);
            const box = svgElement("rect");
            box.setAttribute("x", "-24");
            box.setAttribute("y", "-15");
            box.setAttribute("width", "48");
            box.setAttribute("height", "30");
            box.setAttribute("rx", "8");
            box.setAttribute("fill", "url(#panel)");
            box.setAttribute("stroke", "#668696");
            const lamp = svgElement("circle");
            lamp.setAttribute("r", "7");
            lamp.setAttribute("fill", index === 2 ? "#ffc64b" : "#57efb2");
            lamp.setAttribute("filter", "url(#glow)");
            group.append(box, lamp);
            this.lampsLayer.append(group);
        });
    }
    reflowFoods(previous, next) {
        const gapRatio = next.gap / Math.max(1, previous.gap);
        this.foods.forEach((food) => {
            food.x = next.spawnX + (food.x - previous.spawnX) * gapRatio;
        });
        const nextTargetGap = this.nextSpawnIsRush ? next.rushGap : next.gap;
        this.spawnDistance = rescaleSpawnLattice(this.spawnDistance, this.nextSpawnGap, nextTargetGap);
        this.nextSpawnGap = nextTargetGap;
        this.returnRemaining =
            this.returnFood && this.returnPhase === "rewind"
                ? Math.max(0, this.returnFood.x - next.fillX)
                : this.returnRemaining * gapRatio;
    }
    createFood(state, x, tutorial = false) {
        const element = svgElement("g");
        element.classList.add("food");
        element.setAttribute("role", "img");
        element.setAttribute("aria-label", "產線漢堡");
        const visual = svgNode("g", "food-visual", {});
        const ingredients = svgNode("g", "ingredients", {});
        ingredients.append(svgNode("path", "lettuce", { d: "M-49 8Q-37-3-24 8Q-10-4 2 8Q17-4 30 8Q41-2 49 8L44 18H-44Z" }), svgNode("rect", "patty", { x: -45, y: -2, width: 90, height: 20, rx: 9 }), svgNode("path", "cheese", { d: "M-44-8H44V4L28 12 13 4-4 12-20 4-35 10-44 3Z" }), svgNode("rect", "tomato", { x: -39, y: -16, width: 78, height: 11, rx: 5 }));
        const sesame = svgNode("g", "sesame", {});
        sesame.append(svgNode("ellipse", "", { cx: -23, cy: -34, rx: 4, ry: 2, transform: "rotate(-24 -23 -34)" }), svgNode("ellipse", "", { cx: 0, cy: -45, rx: 4, ry: 2 }), svgNode("ellipse", "", { cx: 24, cy: -31, rx: 4, ry: 2, transform: "rotate(22 24 -31)" }), svgNode("ellipse", "", { cx: -6, cy: -23, rx: 4, ry: 2, transform: "rotate(18 -6 -23)" }));
        visual.append(svgNode("ellipse", "food-shadow", { cx: 0, cy: 34, rx: 51, ry: 12 }), svgNode("rect", "bottom-bun", { x: -47, y: 15, width: 94, height: 26, rx: 12 }), ingredients, svgNode("path", "top-bun", { d: "M-47-13Q-38-58 0-60Q38-58 47-13Q30-5 0-5Q-30-5-47-13Z" }), sesame, svgNode("circle", "missing-ring", { cy: -5, r: 58 }));
        element.append(visual);
        this.foodsLayer.append(element);
        const food = {
            id: this.nextFoodId++,
            x,
            state,
            element,
            baseProcessed: state !== "spawned",
            ingredientProcessed: state === "filled" || state === "base-only",
            playerProcessed: state === "capped",
            scored: false,
            tutorial,
            hidden: false,
            reworkSkips: 0,
            reworkWillSkip: null,
        };
        this.foods.push(food);
        this.renderFood(food);
        return food;
    }
    renderFood(food) {
        const visual = visualContractForFood(food);
        food.element.classList.remove("spawned", "base-only", "filled", "capped", "returning", "rework", "assembly-base", "assembly-open", "assembly-closed", "tutorial-missing-guide", "rework-success", "approved", "return-target");
        food.element.classList.add(food.state);
        food.element.classList.add(`assembly-${visual.assembly}`);
        food.element.classList.toggle("rework-success", food.state === "rework" && food.reworkWillSkip === false);
        food.element.classList.toggle("tutorial-missing-guide", shouldShowTutorialMissingGuide(food));
        food.element.setAttribute("data-gameplay-state", food.state);
        food.element.setAttribute("data-assembly", visual.assembly);
        food.element.setAttribute("aria-label", visual.label);
        this.renderFoodPosition(food);
    }
    transitionFood(food, nextState) {
        const allowed = FOOD_STATE_TRANSITIONS[food.state];
        if (!allowed.includes(nextState)) {
            console.error(`Rejected food transition ${food.state} -> ${nextState}`);
            return false;
        }
        food.state = nextState;
        this.renderFood(food);
        return true;
    }
    renderFoodPosition(food) {
        const scale = this.layout.foodScale;
        food.element.setAttribute("transform", `translate(${food.x} ${this.layout.foodY}) scale(${scale})`);
    }
    removeFood(food) {
        food.element.remove();
        this.foods = this.foods.filter((candidate) => candidate !== food);
        if (this.returnFood === food)
            this.returnFood = null;
    }
    clearFoods() {
        this.foodsLayer.replaceChildren();
        this.foods = [];
        this.returnFood = null;
        this.spawnDistance = 0;
        this.nextSpawnGap = this.layout.gap;
        this.nextSpawnIsRush = false;
        this.rushCooldownSpawns = 0;
        this.actions.clear();
    }
    speedForScore(score) {
        return conveyorSpeedForScore(score);
    }
    currentSpeed() {
        if (this.mode === "tutorial" || (this.mode === "returning" && this.returnOriginMode === "tutorial"))
            return 150;
        return this.speedForScore(this.score);
    }
    reworkSkipRate() {
        return Math.min(0.05 + Math.max(0, this.score) * 0.004, 0.62);
    }
    startTutorial() {
        this.resetFailureReaction();
        this.transitionToken += 1;
        this.clearFoods();
        this.score = 0;
        this.mode = "tutorial";
        this.tutorialStage = 0;
        this.tutorialTransitionAt = 0;
        this.menu.classList.add("hidden");
        this.app.classList.remove("menu-mode");
        this.gameOverOverlay.classList.add("hidden");
        this.pauseOverlay.classList.add("hidden");
        this.hud.classList.remove("hidden");
        this.touchZones.classList.remove("hidden");
        this.cue.classList.remove("hidden");
        this.app.classList.add("tutorial-left");
        this.app.classList.remove("tutorial-right");
        this.setCue("練習 1 / 2", "內餡完整，等待封蓋", "看到有完整內餡、但沒有上層麵包時，點左半邊封蓋");
        this.createFood("filled", this.layout.fillX - 90 * this.layout.scale, true);
        this.renderHud();
    }
    startSecondTutorialStep() {
        this.foods.slice().forEach((food) => this.removeFood(food));
        this.tutorialStage = 2;
        this.app.classList.remove("tutorial-left");
        this.app.classList.add("tutorial-right");
        this.setCue("練習 2 / 2", "這顆漢堡缺料", "看到明顯空缺時，點螢幕右半邊退回補料");
        this.createFood("base-only", this.layout.fillX - 70 * this.layout.scale, true);
    }
    setCue(step, title, detail) {
        this.cueStep.textContent = step;
        this.cueTitle.textContent = title;
        this.cueDetail.textContent = detail;
    }
    startCountdown() {
        this.resetFailureReaction();
        const token = ++this.transitionToken;
        this.clearFoods();
        this.score = 0;
        this.mode = "countdown";
        this.menu.classList.add("hidden");
        this.app.classList.remove("menu-mode");
        this.pauseOverlay.classList.add("hidden");
        this.gameOverOverlay.classList.add("hidden");
        this.cue.classList.add("hidden");
        this.touchZones.classList.add("hidden");
        this.app.classList.remove("tutorial-left", "tutorial-right", "returning", "reworking");
        this.hud.classList.remove("hidden");
        this.renderHud();
        const labels = ["3", "2", "1", "GO!"];
        labels.forEach((label, index) => {
            window.setTimeout(() => {
                if (token !== this.transitionToken)
                    return;
                this.countdown.textContent = label;
                this.countdown.classList.remove("hidden");
                this.countdown.style.animation = "none";
                void this.countdown.offsetWidth;
                this.countdown.style.animation = "";
                if (index < 3)
                    this.audio.play("button");
                else
                    this.audio.play("speedup");
            }, index * COUNTDOWN_STEP_MS);
        });
        window.setTimeout(() => {
            if (token !== this.transitionToken)
                return;
            this.countdown.classList.add("hidden");
            this.beginPlaying();
        }, labels.length * COUNTDOWN_STEP_MS);
    }
    beginPlaying() {
        this.clearFoods();
        this.mode = "playing";
        this.app.classList.remove("menu-mode");
        this.lastFrame = performance.now();
        this.spawnDistance = 0;
        this.touchZones.classList.remove("hidden");
        this.createFood("spawned", this.layout.spawnX);
        this.renderHud();
    }
    showMenu() {
        this.resetFailureReaction();
        this.transitionToken += 1;
        this.clearFoods();
        this.mode = "menu";
        this.menu.classList.remove("hidden");
        this.app.classList.add("menu-mode");
        this.pauseOverlay.classList.add("hidden");
        this.gameOverOverlay.classList.add("hidden");
        this.hud.classList.add("hidden");
        this.touchZones.classList.add("hidden");
        this.cue.classList.add("hidden");
        this.countdown.classList.add("hidden");
        this.app.classList.remove("tutorial-left", "tutorial-right", "returning", "reworking");
        this.bestScoreText.textContent = String(this.store.value.bestScore);
        this.audio.pauseMusic();
    }
    pauseGame() {
        if (!["playing", "returning", "tutorial"].includes(this.mode))
            return;
        this.modeBeforePause = this.mode;
        this.mode = "paused";
        this.activePointerId = null;
        this.pauseOverlay.classList.remove("hidden");
        this.audio.pauseMusic();
    }
    pauseFromNative() {
        if (["playing", "returning", "tutorial"].includes(this.mode))
            this.pauseGame();
    }
    resumeGame() {
        if (this.mode !== "paused")
            return;
        this.mode = this.modeBeforePause;
        this.pauseOverlay.classList.add("hidden");
        this.lastFrame = performance.now();
        this.audio.startMusic();
    }
    handlePointer(event) {
        var _a;
        if ((_a = event.target) === null || _a === void 0 ? void 0 : _a.closest("button"))
            return;
        if (this.mode !== "playing" && this.mode !== "tutorial")
            return;
        event.preventDefault();
        if (this.activePointerId !== null)
            return;
        const now = performance.now();
        if (now - this.lastInputAt < INPUT_LOCK_MS)
            return;
        this.activePointerId = event.pointerId;
        this.lastInputAt = now;
        const rect = this.app.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const action = localX < rect.width * 0.5 ? "FINISH" : "RETURN";
        this.touchFeedback(localX, localY, action);
        const candidates = this.foods.filter((food) => !food.playerProcessed &&
            food.ingredientProcessed &&
            (food.state === "filled" || food.state === "base-only") &&
            food.x >= this.layout.playerX - ACTION_LEAD * this.layout.scale &&
            food.x <= this.layout.deadlineX);
        candidates.sort((first, second) => Math.abs(first.x - this.layout.playerX) - Math.abs(second.x - this.layout.playerX));
        const food = candidates[0];
        if (!food) {
            if (this.mode === "tutorial")
                this.showToast("等漢堡到你的工作站");
            return;
        }
        const needsReturn = food.state === "base-only";
        const correct = (needsReturn && action === "RETURN") || (!needsReturn && action === "FINISH");
        if (!correct) {
            if (this.mode === "tutorial") {
                this.audio.play("fail");
                this.showToast(needsReturn ? "缺料要按右邊 ↩" : "內餡完整要按左邊封蓋 ✓");
                this.cue.animate([{ transform: "translateX(-50%)" }, { transform: "translateX(calc(-50% - 10px))" }, { transform: "translateX(calc(-50% + 10px))" }, { transform: "translateX(-50%)" }], { duration: 260 });
                return;
            }
            this.fail(needsReturn ? "WRONG_FINISH" : "WRONG_RETURN");
            return;
        }
        if (action === "FINISH")
            this.finishFood(food);
        else
            this.startReturn(food);
    }
    releasePointer(event) {
        if (event.pointerId === this.activePointerId)
            this.activePointerId = null;
    }
    finishFood(food) {
        if (!this.transitionFood(food, "capped"))
            return;
        food.playerProcessed = true;
        food.element.classList.add("approved", "just-capped");
        window.setTimeout(() => food.element.classList.remove("just-capped"), ACTION_MS.cap);
        this.actions.play("player", "cap");
        this.audio.play("finish");
        this.vibrate(18);
        if (this.mode === "tutorial") {
            this.tutorialStage = 1;
            this.tutorialTransitionAt = performance.now() + 560;
            this.showToast("正確！內餡完整就按左邊封蓋");
            this.setCue("完成 1 / 2", "封蓋成功", "下一顆會示範缺料漢堡");
            this.app.classList.remove("tutorial-left");
        }
    }
    startReturn(food) {
        const completedDownstream = this.foods.filter((candidate) => candidate !== food && candidate.playerProcessed && candidate.x > this.layout.playerX);
        completedDownstream.forEach((candidate) => {
            candidate.hidden = true;
            candidate.element.setAttribute("visibility", "hidden");
        });
        this.returnOriginMode = this.mode;
        this.returnFood = food;
        this.returnRemaining = Math.max(0, food.x - this.layout.fillX);
        this.returnPhase = "rewind";
        food.reworkWillSkip = null;
        if (!this.transitionFood(food, "returning"))
            return;
        this.actions.play("player", "push");
        this.mode = "returning";
        this.app.classList.add("returning");
        this.app.classList.remove("reworking");
        this.audio.play("return");
        this.vibrate(26);
        if (this.returnOriginMode === "tutorial") {
            this.setCue("練習 2 / 2", "整條產線正在退回", "所有漢堡保持原本間距，退回速度與輸送帶一致");
        }
    }
    updateReturn(deltaSeconds, now) {
        const food = this.returnFood;
        if (!food) {
            this.mode = this.returnOriginMode;
            return;
        }
        if (this.returnPhase === "rewind") {
            const speed = this.currentSpeed() * this.layout.motionScale;
            const shift = Math.min(this.returnRemaining, speed * deltaSeconds);
            this.foods.forEach((candidate) => {
                candidate.x -= shift;
                if (!candidate.hidden)
                    this.renderFoodPosition(candidate);
            });
            this.returnRemaining -= shift;
            this.spawnDistance = rewindSpawnLattice(this.spawnDistance, shift);
            if (this.returnRemaining <= 0.01) {
                const tutorial = this.returnOriginMode === "tutorial";
                food.reworkWillSkip =
                    !tutorial && food.reworkSkips < 2 && this.random.next() < this.reworkSkipRate();
                this.transitionFood(food, "rework");
                this.actions.play("fill", food.reworkWillSkip ? "skip" : "place");
                this.returnPhase = "rework";
                this.reworkReadyAt = now + REWORK_MS;
                this.app.classList.add("reworking");
            }
            this.updateAnticipation();
            return;
        }
        if (now >= this.reworkReadyAt)
            this.completeReturn();
    }
    completeReturn() {
        const food = this.returnFood;
        if (!food)
            return;
        const tutorial = this.returnOriginMode === "tutorial";
        const skip = food.reworkWillSkip === true;
        food.playerProcessed = false;
        food.ingredientProcessed = true;
        if (skip)
            food.reworkSkips += 1;
        this.transitionFood(food, skip ? "base-only" : "filled");
        food.reworkWillSkip = null;
        this.returnFood = null;
        this.app.classList.remove("returning", "reworking");
        this.mode = tutorial ? "tutorial" : "playing";
        if (tutorial) {
            this.tutorialStage = 3;
            this.store.completeTutorial();
            this.setCue("練習完成", "補料成功！", "記住：完整按左，缺料按右");
            this.showToast("準備正式上工！");
            this.app.classList.remove("tutorial-right");
            const token = ++this.transitionToken;
            window.setTimeout(() => {
                if (token === this.transitionToken)
                    this.startCountdown();
            }, 900);
        }
        else if (skip) {
            this.showToast("配料員又漏了！等等再退一次");
        }
        else {
            this.showToast("補料完成");
        }
    }
    fail(reason) {
        if (this.mode === "failing" || this.mode === "gameover")
            return;
        this.mode = "failing";
        this.activePointerId = null;
        this.actions.clear();
        this.app.classList.remove("returning", "reworking");
        this.app.classList.add("failure-reaction");
        this.touchZones.classList.add("hidden");
        this.gameOverOverlay.classList.add("hidden");
        this.audio.play("fail");
        this.vibrate([60, 45, 80]);
        this.store.setBestScore(this.score);
        this.finalScoreText.textContent = String(this.score);
        this.finalBestText.textContent = String(this.store.value.bestScore);
        if (reason === "WRONG_FINISH") {
            this.failureTitle.textContent = "缺料漢堡被送出";
            this.failureDetail.textContent = "看到明顯空缺時，要按右半邊退回。";
        }
        else if (reason === "WRONG_RETURN") {
            this.failureTitle.textContent = "待封蓋漢堡被退回";
            this.failureDetail.textContent = "看到內餡完整、尚未加上層麵包時，要按左半邊封蓋。";
        }
        else {
            this.failureTitle.textContent = "漢堡通過品管員";
            this.failureDetail.textContent = "在漢堡越過最右側人物前完成判斷。";
        }
        const prefersReducedMotion = typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.failureTimeoutId = window.setTimeout(() => {
            this.failureTimeoutId = null;
            this.completeFailure();
        }, failureReactionDelay(prefersReducedMotion));
    }
    completeFailure() {
        if (this.mode !== "failing")
            return;
        this.mode = "gameover";
        this.gameOverOverlay.classList.remove("hidden");
    }
    resetFailureReaction() {
        if (this.failureTimeoutId !== null) {
            window.clearTimeout(this.failureTimeoutId);
            this.failureTimeoutId = null;
        }
        this.app.classList.remove("failure-reaction");
    }
    frame(time) {
        const deltaSeconds = Math.min(MAX_FRAME_SECONDS, Math.max(0, (time - this.lastFrame) / 1000));
        this.lastFrame = time;
        if (this.mode === "playing" || this.mode === "tutorial")
            this.updateLine(deltaSeconds, time);
        else if (this.mode === "returning")
            this.updateReturn(deltaSeconds, time);
        requestAnimationFrame((next) => this.frame(next));
    }
    updateLine(deltaSeconds, now) {
        const speed = this.currentSpeed() * this.layout.motionScale;
        const shift = speed * deltaSeconds;
        this.foods.forEach((food) => {
            const tutorialStop = this.mode === "tutorial" &&
                food.tutorial &&
                food.ingredientProcessed &&
                !food.playerProcessed
                ? this.layout.playerX + 16 * this.layout.scale
                : Number.POSITIVE_INFINITY;
            food.x += Math.min(shift, Math.max(0, tutorialStop - food.x));
            this.processStations(food);
            this.renderFoodPosition(food);
        });
        if (this.mode === "playing") {
            const spawn = advanceSpawnLattice(this.spawnDistance, shift, this.nextSpawnGap);
            this.spawnDistance = spawn.progress;
            if (spawn.overflow !== null) {
                this.createFood("spawned", this.layout.spawnX + spawn.overflow);
                const decision = nextSpawnGapDecision(this.score, this.layout.gap, this.layout.rushGap, this.rushCooldownSpawns, this.rushRandom.next());
                this.nextSpawnGap = decision.gap;
                this.nextSpawnIsRush = decision.rush;
                this.rushCooldownSpawns = decision.cooldown;
            }
        }
        if (this.mode === "tutorial" && this.tutorialStage === 1 && now >= this.tutorialTransitionAt) {
            this.startSecondTutorialStep();
            return;
        }
        const missed = this.foods.find((food) => !food.tutorial && food.ingredientProcessed && !food.playerProcessed && food.x > this.layout.deadlineX);
        if (missed) {
            this.fail("MISSED_DEADLINE");
            return;
        }
        this.foods.slice().forEach((food) => {
            if (!food.scored && food.playerProcessed && food.x >= this.layout.inspectorX) {
                this.approveFood(food);
                if (food.hidden)
                    this.removeFood(food);
            }
            if (food.x > this.layout.width + 130 * this.layout.scale)
                this.removeFood(food);
        });
        this.updateAnticipation();
    }
    foodApproaching(stationX, match) {
        const reach = 82 * this.layout.scale;
        return this.foods.some((food) => match(food) && food.x < stationX + 10 && stationX - food.x < reach && stationX - food.x > -4);
    }
    updateAnticipation() {
        const live = this.mode === "playing" || this.mode === "tutorial" || this.mode === "returning";
        this.actions.setAnticipating("base", live && this.foodApproaching(this.layout.baseX, (food) => !food.baseProcessed));
        this.actions.setAnticipating("fill", live &&
            (this.foodApproaching(this.layout.fillX, (food) => food.baseProcessed && !food.ingredientProcessed) ||
                (this.mode === "returning" && this.returnPhase === "rework")));
        this.actions.setAnticipating("player", (this.mode === "playing" || this.mode === "tutorial") &&
            this.foodApproaching(this.layout.playerX, (food) => food.ingredientProcessed &&
                !food.playerProcessed &&
                (food.state === "filled" || food.state === "base-only")));
        this.actions.setAnticipating("inspector", this.mode === "playing" &&
            this.foodApproaching(this.layout.inspectorX, (food) => food.playerProcessed && !food.scored));
    }
    processStations(food) {
        if (!food.baseProcessed && food.x >= this.layout.baseX) {
            food.baseProcessed = true;
            this.transitionFood(food, "base-only");
            this.actions.play("base", "place");
        }
        if (!food.ingredientProcessed && food.x >= this.layout.fillX) {
            food.ingredientProcessed = true;
            const defective = this.random.next() < DEFECT_RATE;
            this.transitionFood(food, defective ? "base-only" : "filled");
            this.actions.play("fill", defective ? "skip" : "place");
        }
    }
    approveFood(food) {
        food.scored = true;
        food.element.classList.add("approved");
        this.actions.play("inspector", "stamp");
        if (food.tutorial)
            return;
        this.score += 1;
        this.audio.play("approved");
        this.scoreBurst(food.x, this.layout.foodY - 60 * this.layout.scale);
        if (SPEED_MILESTONES.includes(this.score)) {
            this.audio.play("speedup");
            this.showToast("產線加速！");
        }
        this.renderHud();
    }
    renderHud() {
        this.scoreText.textContent = String(this.score);
        const ratio = this.speedForScore(this.score) / START_SPEED;
        this.speedText.textContent = `${ratio.toFixed(1)}×`;
    }
    updateMuteButton() {
        this.muteButton.textContent = this.audio.isMuted ? "×" : "♪";
        this.muteButton.setAttribute("aria-label", this.audio.isMuted ? "開啟音效" : "關閉音效");
    }
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.remove("hidden");
        this.toast.animate([{ opacity: 0, transform: "translate(-50%, -30%) scale(.8)" }, { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }, { opacity: 0, transform: "translate(-50%, -70%) scale(.96)" }], { duration: 760, easing: "ease-out" }).finished.finally(() => this.toast.classList.add("hidden"));
    }
    touchFeedback(x, y, action) {
        const circle = svgElement("circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "none");
        circle.setAttribute("stroke", action === "FINISH" ? "#57efb2" : "#ffab52");
        circle.setAttribute("stroke-width", String(5 * this.layout.scale));
        this.effectsLayer.append(circle);
        circle.animate([{ opacity: 1, transform: "scale(.25)", transformOrigin: `${x}px ${y}px` }, { opacity: 0, transform: "scale(1.4)", transformOrigin: `${x}px ${y}px` }], { duration: 300, easing: "ease-out" }).finished.finally(() => circle.remove());
    }
    scoreBurst(x, y) {
        const text = svgElement("text");
        text.textContent = "+1";
        text.setAttribute("x", String(x));
        text.setAttribute("y", String(y));
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#57efb2");
        text.setAttribute("stroke", "#062118");
        text.setAttribute("stroke-width", "5");
        text.setAttribute("paint-order", "stroke fill");
        text.setAttribute("font-size", String(28 * this.layout.scale));
        text.setAttribute("font-weight", "1000");
        this.effectsLayer.append(text);
        text.animate([{ opacity: 1, transform: "translateY(0) scale(.8)" }, { opacity: 0, transform: `translateY(${-55 * this.layout.scale}px) scale(1.15)` }], { duration: 600, easing: "ease-out" }).finished.finally(() => text.remove());
    }
    vibrate(pattern) {
        if ("vibrate" in navigator)
            navigator.vibrate(pattern);
    }
}
window.addEventListener("DOMContentLoaded", () => {
    new VectorBurgerFactory();
});
