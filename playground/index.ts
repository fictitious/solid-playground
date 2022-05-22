import { render } from 'solid-js/web';
import { AppWithDevtools } from './appWithDevtools';
import { registerServiceWorker } from './utils/serviceWorker';

render(AppWithDevtools, document.querySelector('#app')!);

registerServiceWorker();
