import { createSignal } from 'solid-js';
import './App.css';

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div class="container">
      <header>
        <h1>FWS Health Monitor</h1>
        <p>Monitoring system health and endpoints</p>
      </header>

      <main>
        <div class="card">
          <h2>Welcome to the Dashboard</h2>
          <p>This UI will display health checks and monitoring data.</p>
          <button onClick={() => setCount(count() + 1)}>
            Count: {count()}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
