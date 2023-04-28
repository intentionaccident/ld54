import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { useEffect } from "react";
import { useRef } from "react";
import { Application, Assets, Sprite, Texture } from "pixi.js";
import { GameFrame } from './GameFrame';

function PixiRoot() {
	const ref = useRef(null);
	useEffect(() => {
		const app = new Application({
			width: 640,
			height: 480
		});

		ref.current.appendChild(app.view);
		const texture = Texture.from('assets/bunny.png');

		const bunny = new Sprite(texture);

		bunny.x = app.renderer.width / 2;
		bunny.y = app.renderer.height / 2;
		bunny.anchor.x = 0.5;
		bunny.anchor.y = 0.5;

		app.stage.addChild(bunny);

		app.ticker.add(() => {
			bunny.rotation += 0.01;
		});
	}, [ref]);
	return <div ref={ref} />;
}

const UI = () => {
	return <div>

	</div>
}


const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(
	<GameFrame>
		<UI />
		<PixiRoot />
	</GameFrame>,
	root
);
