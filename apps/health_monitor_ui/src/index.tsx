import { render } from 'solid-js/web';
import App from './App';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or does your framework expect an element with a different id?',
  );
}

render(() => <App />, root!);
