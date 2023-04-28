import * as ReactDOM from 'react-dom'
import { GameFrame } from './GameFrame';
import { UI } from './UI';
import React from 'react';
import { PixiRoot } from './PixiRoot';

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(
	<GameFrame>
		<UI />
		<PixiRoot />
	</GameFrame>,
	root
);
