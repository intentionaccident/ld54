import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { addLaneGraphics, setScore, setLives } from "./Lane";
import { GameState } from "./GameState";
import { tick } from "./tick";
import { BoatManager } from "./BoatManager";
import {createFeatures} from "./Features";

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
	score.x = 520
	app.stage.addChild(score);

	const lives = new PIXI.Text();
	lives.x = 520
	lives.y = 30
	app.stage.addChild(lives)

	const gameState: GameState = {
		app,
		lockButtonTexts: [],
		turn: 0,
		lanes: [],
		actionButtons: [],
		score: { value: 0, graphics: score },
		lives: { value: 0, graphics: lives },
		features: createFeatures()
	};

	gameState.boatManager = new BoatManager(gameState)
	gameState.boatManager.drawBoatFromDeck()
	gameState.boatManager.drawBoatFromDeck()

	const [lanes, actionButtons, lockButtonTexts] = addLaneGraphics(gameState);
	gameState.actionButtons = actionButtons
	gameState.lockButtonTexts = lockButtonTexts
	gameState.lanes = lanes

	setScore(gameState, 0);
	setLives(gameState, 3)
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
