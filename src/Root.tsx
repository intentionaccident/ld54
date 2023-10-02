import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import {addLaneGraphics, setScore, setLives, setLevel, incrementLevel} from "./Lane";
import { GameState } from "./GameState";
import { tick } from "./tick";
import { BoatManager } from "./BoatManager";
import { AbilityBar } from "./AbilityBar";
import {advanceLevel, createConfiguration} from "./Configuration";

export function Root() {
	const app = new PIXI.Application({
		width: 1280,
		height: 640,
		antialias: false,
		backgroundColor: 0x3AC5B9
	});
	app.stage.scale.set(2);


	const texture = PIXI.Texture.from('assets/bunny.png');
	const bunny = new PIXI.Sprite(texture);
	bunny.x = app.renderer.width / app.stage.scale.x / 2;
	bunny.y = app.renderer.height / app.stage.scale.y / 2;

	bunny.anchor.x = 0.5;
	bunny.anchor.y = 0.5;
	app.stage.addChild(bunny);
	app.ticker.add(() => {
		bunny.rotation += 0.01;
	});


	const score = new PIXI.Text();
	score.x = 520;
	app.stage.addChild(score);

	const lives = new PIXI.Text();
	lives.x = 520;
	lives.y = 30;
	app.stage.addChild(lives);

	const level = new PIXI.Text();
	level.x = 520;
	level.y = 60;
	app.stage.addChild(level);
	level.interactive = true;

	const gameState: GameState = {
		app,
		turn: 0,
		lanes: [],
		actionButtons: [],
		score: { value: 0, graphics: score },
		lives: { value: 0, graphics: lives },
		level: { value: 0, graphics: level },
		configuration: createConfiguration(),
		selectedSlot: null,
		activeAbility: null
	};

	gameState.boatManager = new BoatManager(gameState)
	gameState.boatManager.drawBoatFromDeck()
	gameState.boatManager.drawBoatFromDeck()

	const [lanes, actionButtons] = addLaneGraphics(gameState);
	gameState.actionButtons = actionButtons
	gameState.lanes = lanes
	gameState.abilityBar = new AbilityBar(gameState);
	level.on('click', () => incrementLevel(gameState)); // For debugging

	setScore(gameState, 0);
	setLives(gameState, 3);
	setLevel(gameState, 0);
	while (gameState.level.value < 0) incrementLevel(gameState); // For debugging
	for (const button of actionButtons) {
		button.graphics.on('click', () => tick(gameState, button.action));
	}

	return <div>
		<GameFrame>
			<UIRoot />
			<PixiRoot app={app} />
		</GameFrame>
	</div>;
}
