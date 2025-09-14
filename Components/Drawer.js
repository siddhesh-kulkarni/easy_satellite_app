import React, {createContext, useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  DrawerContentScrollView,
  createDrawerNavigator,
} from '@react-navigation/drawer';
import {useNavigationContainerRef} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import BASE_URL from '../api/Api';

const Drawer = createDrawerNavigator();

// Navigation Loading Context
export const NavigationLoadingContext = createContext();

// Custom hook for accessing navigation loading context
export const useNavigationLoading = () => {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error(
      'useNavigationLoading must be used within a NavigationLoadingProvider',
    );
  }
  return context;
};

// Navigation Loading Provider Component
export const NavigationLoadingProvider = ({children}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (!navigationRef) return;

    const unsubscribeBeforeRemove = navigationRef?.addListener(
      'beforeRemove',
      () => {
        setIsNavigating(true);
        setIsLoading(true);
      },
    );

    const unsubscribeTransitionEnd = navigationRef?.addListener(
      'transitionEnd',
      () => {
        setIsNavigating(false);
        setIsLoading(false);
      },
    );

    return () => {
      unsubscribeBeforeRemove?.();
      unsubscribeTransitionEnd?.();
    };
  }, [navigationRef]);

  const contextValue = {
    isLoading,
    setIsLoading,
    isNavigating,
    setIsNavigating,
  };

  return (
    <NavigationLoadingContext.Provider value={contextValue}>
      {children}
      {(isLoading || isNavigating) && (
        <View style={styles.navigationLoader}>
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color="#7248BD" />
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        </View>
      )}
    </NavigationLoadingContext.Provider>
  );
};

// Orbit Types Configuration
const orbitTypes = [
  {key: 'LEO', title: 'Low Earth Orbit', icon: 'rocket-launch'},
  {key: 'MEO', title: 'Medium Earth Orbit', icon: 'satellite-uplink'},
  {key: 'GEO', title: 'Geostationary Orbit', icon: 'earth'},
];

// DrawerItem Component
const DrawerItem = ({label, icon, customIcon, onPress, isActive}) => (
  <TouchableOpacity
    style={[styles.drawerItem, isActive && styles.drawerItemActive]}
    onPress={onPress}>
    {customIcon ? (
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={isActive ? '#fff' : '#a8a8a8'}
      />
    ) : (
      <Ionicons name={icon} size={22} color={isActive ? '#fff' : '#a8a8a8'} />
    )}
    <Text
      style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Custom Drawer Content Component
export const CustomDrawerContent = props => {
  const {setIsLoading, setIsNavigating} = useNavigationLoading();
  const translateX = useSharedValue(-240);
  const opacity = useSharedValue(0);
  const navigation = useNavigation();
  const [showOrbitTypes, setShowOrbitTypes] = useState(false);
  const [username, setUsername] = useState(''); // Add state for username

  useEffect(() => {
    translateX.value = withSpring(0, {damping: 15});
    opacity.value = withTiming(1, {duration: 500});
    const getUserData = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          console.log('User ID:', userId);
          await fetchNameById(userId);
        } else {
          console.log('User ID not found in AsyncStorage');
          showError('User not logged in.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        showError('Error fetching user information.');
      }
    };

    getUserData();
  }, []);

  const fetchNameById = async userId => {
    try {
      const response = await axios.get(
        `${BASE_URL}/fetch_name.php?userId=${userId}`,
        {headers: {'Content-Type': 'application/json'}},
      );

      if (response.data.status === 'success') {
        setUsername(response.data.name);
        console.log('Name fetched:', response.data.name);
      } else {
        console.log('API Response Error:', response.data.message);
        showError(response.data.message);
      }
    } catch (error) {
      console.error('API error:', error.message);
      if (error.response) {
        console.error('Response Data:', error.response.data);
        showError(error.response.data.message || 'Forbidden');
      } else {
        showError('Failed to fetch name from server. Check your connection.');
      }
    }
  };

  const showError = message => {
    // Add an error handling function
    console.error(message);
    // You might want to implement a proper error toast/modal here
  };

  const handleLogout = async () => {
    try {
      setIsNavigating(true);
      setIsLoading(true);
      await AsyncStorage.removeItem('userId');
      console.log('User logged out successfully.');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
      setIsNavigating(false);
    }
  };
  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
    opacity: opacity.value,
  }));

  const handleNavigation = (screenName, params = {}) => {
    setIsLoading(true);
    setIsNavigating(true);
    props.navigation.navigate(screenName, params);

    setTimeout(() => {
      setIsLoading(false);
      setIsNavigating(false);
    }, 500);
  };

  const handleOrbitTypePress = orbitType => {
    handleNavigation('Satellites', {orbitType});
    setShowOrbitTypes(false);
  };

  const handleSatellitesPress = () => {
    setShowOrbitTypes(!showOrbitTypes);
  };

  const isRouteActive = routeName => {
    const currentRoute = props.state.routes[props.state.index];
    return currentRoute.name === routeName;
  };

  return (
    <View style={styles.drawerMainContainer}>
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <Animated.View style={[styles.drawerContainer, drawerAnimatedStyle]}>
          <View style={styles.drawerHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/astronut.jpg')}
                style={styles.avatarImage}
              />
            </View>
            <Text style={styles.drawerTitle}>User Menu</Text>
            <Text style={styles.drawerSubtitle}>
              Welcome {username ? username : 'back'}!
            </Text>
          </View>

          {/* Here handleNavigation and isRouteActive was "Earth" is changed to "EarthGlobe" 11/04/2025 before external */}
          <View style={styles.drawerItemsContainer}>
            <DrawerItem
              label="Earth"
              icon="earth"
              customIcon={true}
              onPress={() => handleNavigation('EarthGlobe')}
              isActive={isRouteActive('EarthGlobe')}
            />
            <DrawerItem
              label="Profile"
              icon="person"
              onPress={() => handleNavigation('Profile')}
              isActive={isRouteActive('Profile')}
            />
            <TouchableOpacity
              style={[
                styles.drawerItem,
                (showOrbitTypes || isRouteActive('Satellites')) &&
                  styles.drawerItemActive,
              ]}
              onPress={handleSatellitesPress}>
              <MaterialCommunityIcons
                name="satellite-variant"
                size={22}
                color={
                  showOrbitTypes || isRouteActive('Satellites')
                    ? '#fff'
                    : '#a8a8a8'
                }
              />
              <Text
                style={[
                  styles.drawerItemText,
                  (showOrbitTypes || isRouteActive('Satellites')) &&
                    styles.drawerItemTextActive,
                ]}>
                Satellite Orbits
              </Text>
              <MaterialCommunityIcons
                name={showOrbitTypes ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={
                  showOrbitTypes || isRouteActive('Satellites')
                    ? '#fff'
                    : '#a8a8a8'
                }
                style={styles.chevron}
              />
            </TouchableOpacity>

            {showOrbitTypes && (
              <View style={styles.orbitTypesContainer}>
                {orbitTypes.map(orbit => (
                  <DrawerItem
                    key={orbit.key}
                    label={orbit.title}
                    icon={orbit.icon}
                    customIcon={true}
                    onPress={() => handleOrbitTypePress(orbit.key)}
                    isActive={
                      isRouteActive('Satellites') &&
                      props.state.routes[props.state.index].params
                        ?.orbitType === orbit.key
                    }
                  />
                ))}
              </View>
            )}
          </View>
          <DrawerItem
            label="Satellite FAQs"
            icon="help-circle"
            customIcon={false}
            onPress={() => handleNavigation('FAQ')}
            isActive={isRouteActive('FAQ')}
          />
          <DrawerItem
            label="Instruction Page"
            icon="information"
            customIcon={true}
            onPress={() => handleNavigation('Home')}
            isActive={isRouteActive('Home')}
          />
          <DrawerItem
            label="Rate Us"
            icon="star"
            customIcon={true}
            onPress={() => handleNavigation('RateApp')}
            isActive={isRouteActive('RateApp')}
          />
        </Animated.View>
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Navigation Wrapper Component with FAQ Screen
export const NavigationWrapper = ({children}) => {
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationLoadingProvider>
      <Drawer.Navigator
        drawerContent={props => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerStyle: {
            width: 240,
            backgroundColor: '#1a1a1a',
          },
          headerShown: false,
          swipeEnabled: true,
          drawerType: 'front',
        }}>
        {children}
      </Drawer.Navigator>
    </NavigationLoadingProvider>
  );
};

// Styles
const styles = StyleSheet.create({
  drawerMainContainer: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#0C2244',
  },
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0C2244',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  drawerSubtitle: {
    color: '#a8a8a8',
    fontSize: 12,
  },
  drawerItemsContainer: {
    flex: 1,
    paddingTop: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  drawerItemActive: {
    backgroundColor: '#7248BD',
  },
  drawerItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#a8a8a8',
  },
  drawerItemTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 'auto',
  },
  orbitTypesContainer: {
    paddingLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FF3B30',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  logoutButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  navigationLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderContent: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  loaderText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export {Drawer};
export default NavigationWrapper;
