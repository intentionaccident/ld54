import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { Boat, getBoatLength, getBoatWidth } from "./Boat";
import { VIEW_HEIGHT, VIEW_WIDTH } from "./view";
import { Lane, addLaneGraphics, setScore, setLives } from "./Lane";
import { GameState } from "./GameState";
import { tick } from "./tick";
import { BoatManager } from "./BoatManager";

function moorBoat(boat: Boat, moorIndex: number, lanes: Lane[], mooredBoats: Boat[], app: PIXI.Container) {
	boat.graphics.rotation = Math.PI / 8 * 3
	boat.graphics.x = VIEW_WIDTH - (getBoatLength(boat) * Math.cos(boat.graphics.rotation))
		- moorIndex * (getBoatLength(boat) * Math.cos(boat.graphics.rotation) + getBoatWidth(boat) * Math.sin(boat.graphics.rotation));
	const deltaY = (getBoatWidth(boat) * Math.cos(boat.graphics.rotation))
	const initialPosition = (VIEW_HEIGHT) - (getBoatLength(boat) * Math.sin(boat.graphics.rotation)) + deltaY;
	boat.graphics.y = initialPosition
	boat.graphics.on("mouseenter", () => boat.graphics.y -= deltaY)
	boat.graphics.on("mouseleave", () => boat.graphics.y = initialPosition)

	mooredBoats[moorIndex] = boat

}

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
	const [lanes, actionButtons, lockButtonTexts] = addLaneGraphics(app);
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
		app, actionButtons, lockButtonTexts, lanes, turn: 0,
		score: { value: 0, graphics: score },
		lives: { value: 0, graphics: lives }
	};


	gameState.boatManager = new BoatManager(gameState)
	gameState.boatManager.drawBoatFromDeck()
	gameState.boatManager.drawBoatFromDeck()

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
