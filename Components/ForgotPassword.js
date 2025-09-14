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
  Dimensions,
  Easing,
  ScrollView,
  Modal,
} from 'react-native';
import {LinearGradient} from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import BASE_URL from '../api/Api';

const {width, height} = Dimensions.get('window');

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

// Error animation component
const ErrorAnimation = ({visible, message, title, onClose}) => {
  const [animationFinished, setAnimationFinished] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  const getErrorAnimation = () => {
    if (title === 'Reset Failed') {
      return require('../assets/error.json');
    } else if (title === 'Error') {
      return require('../assets/error.json');
    } else {
      return require('../assets/error.json');
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.errorContainer}>
          <LottieView
            ref={animationRef}
            source={getErrorAnimation()}
            style={styles.lottieAnimation}
            loop={false}
            autoPlay
            onAnimationFinish={() => setAnimationFinished(true)}
          />
          <Text style={styles.errorTitle}>{title}</Text>
          <Text style={styles.errorMessage}>{message}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={onClose}>
            <LinearGradient
              colors={['#4a90e2', '#357abd']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.buttonGradient}>
              <Text style={styles.errorButtonText}>ACKNOWLEDGE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showRocket, setShowRocket] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigation = useNavigation();

  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [containerOpacity] = useState(new Animated.Value(0));
  const [containerScale] = useState(new Animated.Value(0.9));
  const [buttonScale] = useState(new Animated.Value(1));

  useEffect(() => {
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
  }, []);

  // Show error modal instead of Alert
  const showError = (title, message) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  // Validation and reset password functions
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    if (!email) {
      setEmailError('Email is required.');
      isValid = false;
    } else {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(email)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password should be at least 6 characters long.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await axios.post(
        `${BASE_URL}/forgot_password.php`,
        {
          email,
          password,
          confirmPassword,
        },
      );

      if (result.data.status === 'success') {
        setIsCountdown(true);
        startCountdown();
      } else {
        showError('Reset Failed', result.data.message);
      }
    } catch (error) {
      showError('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startCountdown = () => {
    let timer = 3;
    setCountdown(timer);
    const intervalId = setInterval(() => {
      timer--;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(intervalId);
        setShowRocket(true);
        setIsCountdown(false);
      }
    }, 800);
  };

  const handleRocketAnimationComplete = () => {
    if (!isNavigating) {
      setIsNavigating(true);
      setTimeout(() => {
        navigation.navigate('Login');
      }, 500);
    }
  };

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
          contentContainerStyle={styles.scrollViewContent}
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
              <View style={styles.glowCircle} />
              <Text style={styles.title}>COSMOCODE UPDATE</Text>
              <Text style={styles.subtitle}>Secure Your Space Account</Text>

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
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
                {confirmPasswordError ? (
                  <Text style={styles.errorText}>{confirmPasswordError}</Text>
                ) : null}
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
                    onPress={handleResetPassword}
                    disabled={isLoading}>
                    <LinearGradient
                      colors={['#4a90e2', '#357abd']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.buttonGradient}>
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'PROCESSING...' : 'COSMIC KEY RESET'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Remember your key?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}>
                  <Text style={styles.footerLink}>
                    Return to Space Satellite Portal
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showRocket && (
        <RocketAnimation
          visible={showRocket}
          onComplete={handleRocketAnimationComplete}
        />
      )}

      {/* Error Modal */}
      <ErrorAnimation
        visible={errorModalVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 50,
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
  loginContainer: {
    width: '85%',
    backgroundColor: 'rgba(13,16,44,0.65)',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 20},
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
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
  input: {
    padding: 12,
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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
  errorText: {
    color: '#e33241',
    fontSize: 12,
    marginTop: 5,
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
  // Error modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: '80%',
    backgroundColor: 'rgba(13,16,44,0.9)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  errorTitle: {
    fontSize: 22,
    color: '#e33241',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    width: '80%',
    marginTop: 10,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default ForgotPassword;
