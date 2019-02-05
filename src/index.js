import { h, app } from 'hyperapp';

const state = {
    //No-op
};

//Need to import Actions
const actions = {
  
};

const view = (state, actions) => (
  <div class="container">
    <h1>CatUSim</h1>
  </div>
);

const main = app(state, actions, view, document.body);