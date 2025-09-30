import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, StatusBar } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import BreathingSessionScreen from './src/screens/BreathingSessionScreen';
import SessionCompleteScreen from './src/screens/SessionCompleteScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Ou uma tela de loading
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Usuário logado
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="BreathingSession" component={BreathingSessionScreen} />
          <Stack.Screen name="SessionComplete" component={SessionCompleteScreen} />
        </>
      ) : (
        // Usuário não logado
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#667eea" 
        translucent={false}
      />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
};

export default App;
