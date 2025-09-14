import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {LinearGradient} from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LottieView from 'lottie-react-native'; // Import LottieView
import BASE_URL from '../api/Api';

const {width, height} = Dimensions.get('window');

// Error Modal Component
const ErrorModal = ({visible, message, onClose}) => {
  const animation = useRef(null);

  useEffect(() => {
    if (visible && animation.current) {
      animation.current.play();
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.lottieContainer}>
            <LottieView
              ref={animation}
              source={require('../assets/error.json')}
              style={styles.lottieAnimation}
              autoPlay={false}
              loop={true}
            />
          </View>
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <LinearGradient
              colors={['#4a90e2', '#357abd']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.buttonGradient}>
              <Text style={styles.modalButtonText}>OK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const RocketAnimation = ({visible, onComplete}) => {
  const rocketPosition = useRef(new Animated.Value(height)).current;
  const smokeOpacity = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fireScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      Animated.parallel([
        Animated.timing(smokeOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rocketPosition, {
          toValue: -200,
          duration: 3000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(onComplete, 500);
      });
    }
  }, [visible]);

  const Smoke = ({delay, side}) => {
    const smokeY = useRef(new Animated.Value(0)).current;
    const smokeX = useRef(new Animated.Value(0)).current;
    const particleOpacity = useRef(new Animated.Value(0.8)).current;

    React.useEffect(() => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(smokeY, {
            toValue: 100,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(smokeX, {
            toValue: side * 50,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particleOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        smokeY.setValue(0);
        smokeX.setValue(0);
        particleOpacity.setValue(0.8);
      });
    }, [visible]);

    return (
      <Animated.View
        style={[
          styles.smokeParticle,
          {
            transform: [{translateY: smokeY}, {translateX: smokeX}],
            opacity: particleOpacity,
          },
        ]}
      />
    );
  };

  return (
    <Animated.View
      style={[
        styles.rocketContainer,
        {transform: [{translateY: rocketPosition}]},
      ]}>
      {Array(10)
        .fill(0)
        .map((_, i) => (
          <Smoke key={i} delay={i * 200} side={i % 2 === 0 ? 1 : -1} />
        ))}
      <View style={styles.rocket}>
        <View style={styles.rocketBody} />
        <View style={styles.rocketHead} />
        <View style={styles.finLeft} />
        <View style={styles.finRight} />
      </View>
      <Animated.View
        style={[styles.fireContainer, {transform: [{scale: fireScale}]}]}>
        <LinearGradient
          colors={['#FF4500', '#FF8C00', 'transparent']}
          style={styles.fire}
          start={{x: 0.5, y: 0}}
          end={{x: 0.5, y: 1}}
        />
      </Animated.View>
    </Animated.View>
  );
};

const StarField = () => {
  const stars = Array(150)
    .fill(0)
    .map(() => ({
      left: Math.random() * width,
      top: Math.random() * 1000,
      animationDuration: Math.random() * 2000 + 1000,
    }));

  return (
    <View style={styles.starsContainer}>
      {stars.map((star, index) => (
        <Animated.View
          key={index}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              opacity: Math.random(),
              transform: [{scale: Math.random() * 0.8 + 0.5}],
            },
          ]}
        />
      ))}
    </View>
  );
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));
  const [containerScale] = useState(new Animated.Value(0.9));
  const [containerOpacity] = useState(new Animated.Value(0));
  const [countdown, setCountdown] = useState(3);
  const [showRocket, setShowRocket] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [userType, setUserType] = useState(null);

  // Add error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const checkLoginStatus = async () => {
    try {
      const [isLoggedIn, userId, userType] = await Promise.all([
        AsyncStorage.getItem('isLoggedIn'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userType'), // Retrieve the userType
      ]);

      if (isLoggedIn === 'true' && userId) {
        if (userType === 'admin') {
          // Navigate to AdminDashboard if the user is an admin
          navigation.reset({
            index: 0,
            routes: [{name: 'AdminDashboard'}],
          });
        } else {
          // Navigate to Home for regular users
          navigation.reset({
            index: 0,
            routes: [{name: 'Home'}],
          });
        }
      } else {
        // Show splash screen animation if not logged in
        setTimeout(() => {
          setIsSplashVisible(false);
          Animated.parallel([
            Animated.timing(containerOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.spring(containerScale, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsSplashVisible(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const startCountdown = () => {
    setIsCountdown(true);
    let timer = 3;
    setCountdown(timer);
    const intervalId = setInterval(() => {
      timer--;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(intervalId);
        setIsCountdown(false);
        setShowRocket(true); // Start rocket animation after countdown
      }
    }, 800);
  };

  const handleRocketAnimationComplete = () => {
    if (!isNavigating) {
      setIsNavigating(true);
      // Navigate based on userType after rocket animation
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: userType === 'admin' ? 'AdminDashboard' : 'Home',
            },
          ],
        });
      }, 500);
    }
  };

  // Function to show error modal
  const showError = message => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showError('All fields are required!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${BASE_URL}/login.php`,
        {
          email,
          password,
        },
      );
      console.log("BASE API: ", `${BASE_URL}/login.php`);
      if (response.data.status === 'success') {
        // Store user data
        await Promise.all([
          AsyncStorage.setItem('isLoggedIn', 'true'),
          AsyncStorage.setItem('userId', response.data.userId.toString()),
          AsyncStorage.setItem('userType', response.data.userType),
          AsyncStorage.setItem('userEmail', email),
        ]);

        // Store userType in state for navigation after animation
        setUserType(response.data.userType);

        // Start the sequence: countdown -> rocket -> navigation
        startCountdown();
      } else {
        showError('Invalid credentials, please try again.');
      }
    } catch (error) {
      console.error('Login Error:', error);
      showError('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSplashVisible) {
    return (
      <ImageBackground
        source={require('../assets/earth.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover">
        <StarField />
        <LinearGradient
          colors={['rgba(0,0,40,0.3)', 'rgba(0,0,20,0.4)']}
          style={styles.overlay}
        />
        <View style={styles.splashContainer}>
          <Text style={styles.title}>SPACE SATELLITE PORTAL</Text>
          <ActivityIndicator
            size="large"
            color="#52a8ec"
            style={styles.activityIndicator}
          />
          <Text style={[styles.subtitle, styles.loadingText]}>Loading...</Text>
        </View>
        {showRocket && (
          <RocketAnimation
            visible={showRocket}
            onComplete={handleRocketAnimationComplete}
          />
        )}
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/earth.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover">
      <StarField />
      <LinearGradient
        colors={['rgba(0,0,40,0.3)', 'rgba(0,0,20,0.4)']}
        style={styles.overlay}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -64 : 0}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollViewContent,
            {minHeight: height},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.loginContainer,
                {
                  opacity: containerOpacity,
                  transform: [{scale: containerScale}],
                },
              ]}>
              {/* Keep existing login form content */}
              <View style={styles.glowCircle} />
              <Text style={styles.title}>SPACE SATELLITE PORTAL</Text>
              <Text style={styles.subtitle}>Begin Your Journey</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>EMAIL ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              {isCountdown && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}

              {!isCountdown && (
                <Animated.View style={{transform: [{scale: buttonScale}]}}>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={isLoading}>
                    <LinearGradient
                      colors={['#4a90e2', '#357abd']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.buttonGradient}>
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'PROCESSING...' : 'INITIATE LOGIN'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotLink}>
                      Lost Satellite Portal Password?
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>
                  Don't have Space Satellite Account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.footerLink}>
                    Create Your Space Satellite Account
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />

      {showRocket && (
        <RocketAnimation
          visible={showRocket}
          onComplete={handleRocketAnimationComplete}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activityIndicator: {
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#52a8ec',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Platform.select({
      ios: 50,
      android: 30,
    }),
    minHeight: Dimensions.get('window').height,
  },
  loginContainer: {
    width: Platform.select({
      ios: '85%',
      android: '90%',
    }),
    maxWidth: 400,
    backgroundColor: 'rgba(13,16,44,0.65)',
    borderRadius: 25,
    padding: Platform.select({
      ios: 25,
      android: 20,
    }),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Platform.select({
        ios: 20,
        android: 10,
      }),
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    alignSelf: 'center',
  },
  input: {
    padding: 12,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(82,168,236,0.1)',
    shadowColor: '#52a8ec',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 2,
    textShadowColor: 'rgba(82,168,236,0.8)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#2196F3',
    fontSize: 12,
    marginBottom: 6,
    letterSpacing: 1,
    fontWeight: '600',
  },
  buttonGradient: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginButton: {
    marginTop: 10,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  footerContainer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 6,
  },
  footerLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotLink: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  rocketContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  rocket: {
    width: 40,
    height: 80,
    alignItems: 'center',
  },
  rocketBody: {
    width: 20,
    height: 60,
    backgroundColor: '#D3D3D3',
    borderRadius: 10,
  },
  rocketHead: {
    position: 'absolute',
    top: -10,
    width: 20,
    height: 20,
    backgroundColor: '#A9A9A9',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  finLeft: {
    position: 'absolute',
    bottom: 0,
    left: -10,
    width: 15,
    height: 20,
    backgroundColor: '#A9A9A9',
    transform: [{rotate: '45deg'}],
  },
  finRight: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    width: 15,
    height: 20,
    backgroundColor: '#A9A9A9',
    transform: [{rotate: '-45deg'}],
  },
  fireContainer: {
    position: 'absolute',
    bottom: -40,
    alignItems: 'center',
  },
  fire: {
    width: 20,
    height: 40,
    borderRadius: 10,
  },
  smokeParticle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(200, 200, 200, 0.5)',
    bottom: 0,
  },
  countdownContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'rgba(13,16,44,0.9)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  lottieContainer: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  modalTitle: {
    fontSize: 22,
    color: '#ff3b30',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    width: '80%',
    overflow: 'hidden',
    borderRadius: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default LoginScreen;
