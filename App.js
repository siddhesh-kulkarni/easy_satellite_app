import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import LoginScreen from './Components/LoginScreen';
import Signup from './Components/Signup';
import ForgotPassword from './Components/ForgotPassword';
import Home from './Components/Home';
import Earth from './Components/Earth';
import EarthWithSatellite from './Components/EarthWithSatellite';
import AdminDashboard from './Components/AdminDashboard';
import Satellites from './Components/Satellites';
import UpdateSatellites from './Components/UpdateSatellites';
import AddSatellites from './Components/AddSatellites';
import SatelliteInfo from './Components/SatelliteInfo';
import SatellitesView from './Components/SatellitesView';
import FAQ from './Components/FAQ'; 

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <View style={styles.container}>
        <View style={styles.starsBackground} />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
            animationTypeForReplace: 'pop',
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Signup"
            component={Signup}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="EarthWithSatellite"
            component={EarthWithSatellite}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Earth"
            component={Earth}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="AddSatellites"
            component={AddSatellites}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="UpdateSatellites"
            component={UpdateSatellites}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Satellites"
            component={Satellites}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="SatelliteInfo"
            component={SatelliteInfo}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="SatellitesView"
            component={SatellitesView}
            options={{
              presentation: 'card',
            }}
          />
            <Stack.Screen
            name="FAQ"
            component={FAQ}
            options={{
              presentation: 'card',
            }}
          />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  starsBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: -1,
    overflow: 'hidden',
  },
});