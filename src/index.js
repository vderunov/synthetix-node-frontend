import ReactDOM from 'react-dom/client';

import { App } from './App';

async function run() {
  const root = ReactDOM.createRoot(document.querySelector('#app'));
  root.render(<App />);
}

run();

if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    // do nothing
  });
}
