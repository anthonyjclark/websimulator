import { h, app } from 'hyperapp';
import './js/constraints';

const state = {
    //No-op
};

//Need to import Actions
const actions = {
};

const view = (state, actions) => (
<div id = "buttonsBar">Interact:
  <button id = "playBtn">1</button>
  <button id = "pauseBtn">2</button>
  <button id = "trialBtn">3</button>
</div>
);  

const main = app(state, actions, view, document.body);