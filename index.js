/**
 * @format
 */

// Must be the very first import so the gesture handler native module is
// installed before any React component tree is created.
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
