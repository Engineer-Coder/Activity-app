import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RegisterScreen from './RegisterScreen';
import SportsScreen from './SportsScreen';
import LobbyScreen from './LobbyScreen';
import ChatRoomScreen from './ChatRoomScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Register">
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="SportsSelection" component={SportsScreen} options={{ title: 'Activities' }} />
        <Stack.Screen name="Lobby" component={LobbyScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ title: 'Match Chat' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
