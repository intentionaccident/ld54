import * as React from "react";
import * as PIXI from "pixi.js";
import { GameFrame } from "./GameFrame";
import { UIRoot } from "./UIRoot";
import { PixiRoot } from "./PixiRoot";
import { addLaneGraphics, setScore, setLives, setLevel, incrementLevel, setProgress } from "./Lane";
import { GameState } from "./GameState";
import { tick } from "./tick";
import { BoatManager, moveBoatToLane } from "./BoatManager";
import { AbilityBar } from "./AbilityBar";
import { animate } from "./animate";
import { advanceLevel, createConfiguration } from "./Configuration";
import { ScoreDisplay } from "./ScoreDisplay";

export const lighthouseTextures = [PIXI.Texture.from('assets/lighthouse1.png'),
PIXI.Texture.from('assets/lighthouse2.png'),
PIXI.Texture.from('assets/lighthouse3.png'),
PIXI.Texture.from('assets/lighthouse4.png'),
PIXI.Texture.from('assets/lighthouse5.png'),
PIXI.Texture.from('assets/lighthouse6.png'),
];

export class Lighthouse {
	private readonly sprites: PIXI.Sprite[] = [];
	private readonly container: PIXI.Container;
	constructor(private readonly app: PIXI.Application) {
		this.container = new PIXI.Container();
		app.stage.addChild(this.container);
		this.container.x = 40;
		this.container.y = 20;
		for (let i = 0; i < 6; i++) {
			let sprite = new PIXI.Sprite(lighthouseTextures[i]);
			this.sprites.push(sprite);
			this.container.addChild(sprite);
		}
	}

	public setLives(lives: number) {
		for (let i = 0; i < 6; i++) {
			this.sprites[i].visible = false;
		}
		this.sprites[5 - lives].visible = true;
	}

	public setZIndex(z: number) {
		this.app.stage.setChildIndex(this.container, z)
	}
}

enum LetterType {
	Intro,
	Death,
	LevelAdvance
}

const messages: Record<LetterType, string> = {
	[LetterType.Death]: "Due to gross negligence and loss of cargo we regret to announce your immediate dismissal from the position of Harbour Master. Good luck in future ventures.",
	[LetterType.Intro]: "Welcome to the Port. You must deliver the requested goods to the ships in the correct order. Make sure not to misload the ships or drop any cargo into the harbour, the lighthouse man will be keeping count of the missed shipments.",
	[LetterType.LevelAdvance]: "Great work yesterday, % of October. Keep it up day."
}

export function Root() {
	const [text, setText] = React.useState<LetterType | null>(LetterType.Intro)
	const [gameState, setGameState] = React.useState<GameState | null>(null);
	React.useEffect(() => {
		const app = new PIXI.Application({
			width: 1280,
			height: 640,
			antialias: false,
			backgroundColor: 0x3AC5B9
		});
		const water = new PIXI.Sprite(PIXI.Texture.from('assets/background.gif'));
		app.stage.addChild(water)

		const anchor = new PIXI.Sprite(PIXI.Texture.from('assets/anchor.png'));
		app.stage.addChild(anchor)

		const texture = PIXI.Texture.from('assets/bunny.png');
		const bunny = new PIXI.Sprite(texture);
		bunny.x = app.renderer.width / app.stage.scale.x / 2;
		bunny.y = app.renderer.height / app.stage.scale.y / 2;

		bunny.anchor.x = 0.5;
		bunny.anchor.y = 0.5;
		app.stage.addChild(bunny);


		const score = new PIXI.Text();
		score.x = 2 * 520;
		app.stage.addChild(score);

		const lives = new PIXI.Text();
		lives.x = 2 * 520;
		lives.y = 2 * 30;
		app.stage.addChild(lives);

		const level = new PIXI.Text();
		level.x = 2 * 520;
		level.y = 2 * 60;
		app.stage.addChild(level);

		const progress = new PIXI.Text();
		progress.x = 2 * 600;
		progress.y = 2 * 90;
		app.stage.addChild(progress);

		const gameState: GameState = {
			app,
			turn: 0,
			lanes: [],
			actionButtons: [],
			score: {value: 0},
			lives: {value: 0},
			level: {value: 0},
			progress: {value: 0},
			configuration: createConfiguration(),
			selectedSlot: null,
			activeAbility: null,
			laneAnimations: [],
			actionAnimations: [],
			nonBlockingAnimations: [],
			popupIsActive: false,
			lighthouse: new Lighthouse(app),
			onDeath: () => setText(LetterType.Death),
			onLevelChanged: () => setText(LetterType.LevelAdvance)
		};
		app.ticker.add(() => {
			bunny.rotation += 0.01;
			animate(gameState, app.ticker);
		});

		gameState.boatManager = new BoatManager(gameState)
		gameState.boatManager.drawBoatFromDeck()
		gameState.boatManager.drawBoatFromDeck()

		const [lanes, actionButtons] = addLaneGraphics(gameState);
		gameState.actionButtons = actionButtons
		gameState.lanes = lanes
		gameState.abilityBar = new AbilityBar(gameState);

		const office = new PIXI.Sprite(PIXI.Texture.from('assets/office.gif'));
		app.stage.addChildAt(office, 12);

		gameState.boatManager.setHandContainerZIndex(12);
		gameState.lighthouse.setZIndex(10);

		gameState.scoreDisplay = new ScoreDisplay(gameState.app);

		setScore(gameState, 0);
		setLives(gameState, 5);
		setLevel(gameState, 0);
		setProgress(gameState, 0);
		while (gameState.level.value < 0) incrementLevel(gameState); // For debugging
		for (const button of actionButtons) {
			button.graphics.on('click', () => tick(gameState, button.action));
		}
		setGameState(gameState);
	}, []);

	if (gameState === null) return null;
	
	return <div>
		<GameFrame>
			<PixiRoot app={gameState!.app} />
			{text != null && <UIRoot
				text={messages[text].replace("%", (gameState!.level.value + 2).toString())}
				close={() => setText(null)}
				reload={text === LetterType.Death}
				post={text === LetterType.Intro && "Don't forget to take a break and smoke your pipe once in a while."}
			/>}
		</GameFrame>
	</div>;
}
