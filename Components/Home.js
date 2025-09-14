import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Modal,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import BASE_URL from '../api/Api';

const Home = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const lottieRef = useRef(null);
  const logoutLottieRef = useRef(null);

  // Show error with Lottie animation instead of Alert
  const showError = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  };

  const fetchNameById = async (userId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/fetch_name.php?userId=${userId}`,
        { headers: { 'Content-Type': 'application/json' } }
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      setLogoutModalVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error logging out:', error);
      showError('Error logging out. Please try again.');
    }
  };

  // Initial setup - get user data when component mounts
  useEffect(() => {
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

  // Handle back button press ONLY when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const backAction = () => {
        if (logoutModalVisible) {
          setLogoutModalVisible(false);
          return true;
        }

        setLogoutModalVisible(true);
        if (logoutLottieRef.current) {
          logoutLottieRef.current.play();
        }
        return true;
      };

      // Add event listener for the back button
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );

      // Clean up the event listener when the screen loses focus
      return () => backHandler.remove();
    }, [logoutModalVisible])
  );

  return (
    <ImageBackground
      source={require('../assets/earth.jpg')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        {/* Fixed Headers - Positioned lower */}
        <View style={styles.headerContainer}>
          {/* App Title */}
          <Text style={styles.newHeading}>Satellite Control System</Text>

          {/* Welcome Message */}
          <Text style={styles.mainHeading}>Welcome {username || 'User'}</Text>

          {/* Subheading */}
          <Text style={styles.subheading}>How to operate the App</Text>
        </View>

        {/* Instructions Container - ScrollView inside */}
        <View style={styles.instructionsWrapper}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsHeading}>Instructions:</Text>

            {/* ScrollView inside the instruction container */}
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.bulletContainer}>
                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    When you click on the "Go" button below you'll see an earth
                    model
                  </Text>
                </View>

                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    On the left side you can see a drawer with various options
                    (Earth, Profile, Satellite Orbits, Rate us, Instruction
                    Page)
                  </Text>
                </View>

                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    Under Profile you can view, update your Profile with
                    password
                  </Text>
                </View>

                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    Under Satellite Orbits you can see three Orbits (LEO, MEO,
                    GEO)
                  </Text>
                </View>

                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    By clicking one of the orbit and selecting a satellite
                    you'll get to know and track the satellite
                  </Text>
                </View>

                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    If you liked our work please do not forget to Rate us
                  </Text>
                </View>

                <View style={styles.bulletPointContainer}>
                  <Text style={styles.bulletStar}>🌟</Text>
                  <Text style={styles.bulletText}>
                    Click the below "Go" button
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Navigation Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Earth')}>
          <Text style={styles.buttonText}>Go</Text>
        </TouchableOpacity>

        {/* Error Modal with Lottie Animation */}
        <Modal
          transparent={true}
          visible={errorModalVisible}
          animationType="fade"
          onRequestClose={() => setErrorModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.lottieContainer}>
                <LottieView
                  ref={lottieRef}
                  source={require('../assets/error.json')}
                  autoPlay={true}
                  loop={true}
                  style={styles.lottieAnimation}
                />
              </View>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setErrorModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Logout Confirmation Modal with Lottie Animation */}
        <Modal
          transparent={true}
          visible={logoutModalVisible}
          animationType="fade"
          onRequestClose={() => setLogoutModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.lottieContainer}>
                <LottieView
                  ref={logoutLottieRef}
                  source={require('../assets/logout.json')}
                  autoPlay={true}
                  loop={true}
                  style={styles.lottieAnimation}
                />
              </View>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutMessage}>
                Are you sure you want to logout?
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.logoutButton, styles.noButton]}
                  onPress={() => setLogoutModalVisible(false)}>
                  <Text style={styles.buttonText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.logoutButton, styles.yesButton]}
                  onPress={handleLogout}>
                  <Text style={styles.buttonText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay for better readability
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 40, // Added more top margin to position headers lower
  },
  newHeading: {
    fontSize: 20,
    color: '#FFD700', // Gold color
    fontFamily: 'serif',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    textTransform: 'uppercase',
  },
  mainHeading: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textTransform: 'uppercase',
  },
  subheading: {
    fontSize: 22,
    color: '#FFAA33',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  instructionsWrapper: {
    flex: 1,
    marginVertical: 10,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  instructionsContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
    flex: 1,
  },
  instructionsHeading: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    textDecorationLine: 'underline',
  },
  bulletContainer: {
    paddingLeft: 10,
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  bulletStar: {
    fontSize: 16,
    color: 'white',
    marginRight: 10,
    lineHeight: 25,
  },
  bulletText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 25,
    fontWeight: '500',
    textAlign: 'left',
    flex: 1,
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
    alignSelf: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Error Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  lottieContainer: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF5555',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Logout Modal Styles
  logoutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  logoutMessage: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    gap: 10
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  yesButton: {
    backgroundColor: '#FF5555',
  },
  noButton: {
    backgroundColor: '#1E90FF',
  },
});

export default Home;