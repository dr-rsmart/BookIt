import { registerRootComponent } from 'expo';
import App from './mobile/App';

// Entry point for the native BookIt! shell (Expo / React Native).
// Hosts the production BookIt! South Africa web application in an offline-resilient WebView.
registerRootComponent(App);
