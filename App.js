import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import Login from './src/screens/login';
import Signup from './src/screens/signup';
import Camera from './src/screens/camera';

const Stack = createStackNavigator();

function GlucoReaderRoutes() {
  return (
    <Stack.Navigator
      initialRouteName="Camera"
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Camera" component={Camera} />
    </Stack.Navigator>
  );
}

export default class App extends React.Component {
  render() {
    return (
      <NavigationContainer>
        <GlucoReaderRoutes />
      </NavigationContainer>
    );
  }
}
