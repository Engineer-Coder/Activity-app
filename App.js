import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your screens
import RegisterScreen from './RegisterScreen';
import SportsScreen from './SportsScreen';
import LobbyScreen from './LobbyScreen';
import ChatRoomScreen from './ChatRoomScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* Set initialRouteName directly to SportsSelection */}
      <Stack.Navigator initialRouteName="SportsSelection">
        
        {/* Main Beta Entrance */}
        <Stack.Screen 
          name="SportsSelection" 
          component={SportsScreen} 
          options={{ title: 'Select a Sport' }}
        />
        
        <Stack.Screen 
          name="Lobby" 
          component={LobbyScreen} 
          options={({ route }) => ({ title: `${route.params.sportName} Lobby` })}
        />
        
        <Stack.Screen 
          name="ChatRoom" 
          component={ChatRoomScreen} 
          options={{ title: 'Match Chat' }}
        />

        {/* Keeping Register here just in case you want to link back to it later */}
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ title: 'Sign Up' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}