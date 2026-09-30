import { render } from 'preact';
import { App } from './App';
import "@/Design/Tokens/Tokens.css";

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
render(<App />, root);