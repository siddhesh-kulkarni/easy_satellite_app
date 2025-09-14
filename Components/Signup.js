import React, { useState, useRef, useEffect } from 'react';
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
  Modal
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import BASE_URL from '../api/Api';

const { width, height } = Dimensions.get('window');

const RocketAnimation = ({ visible, onComplete }) => {
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
        ])
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

  const Smoke = ({ delay, side }) => {
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
          { transform: [{ translateY: smokeY }, { translateX: smokeX }], opacity: particleOpacity },
        ]}
      />
    );
  };

  return (
    <Animated.View style={[styles.rocketContainer, { transform: [{ translateY: rocketPosition }] }]}>
      {Array(10).fill(0).map((_, i) => (
        <Smoke key={i} delay={i * 200} side={i % 2 === 0 ? 1 : -1} />
      ))}
      <View style={styles.rocket}>
        <View style={styles.rocketBody} />
        <View style={styles.rocketHead} />
        <View style={styles.finLeft} />
        <View style={styles.finRight} />
      </View>
      <Animated.View style={[styles.fireContainer, { transform: [{ scale: fireScale }] }]}>
        <LinearGradient
          colors={['#FF4500', '#FF8C00', 'transparent']}
          style={styles.fire}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
};

const StarField = () => {
  const stars = Array(150).fill(0).map(() => ({
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
              transform: [{ scale: Math.random() * 0.8 + 0.5 }],
            },
          ]}
        />
      ))}
    </View>
  );
};

// Error Modal Component with Lottie Animation
const ErrorModal = ({ visible, message, onClose }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LottieView
            ref={animationRef}
            source={require('../assets/error.json')}
            style={styles.lottieAnimation}
            autoPlay={false}
            loop={true}
          />
          <Text style={styles.modalTitle}>Error</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.modalButtonText}>CLOSE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mobileNumberError, setMobileNumberError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showRocket, setShowRocket] = useState(false);
  const [isCountdown, setIsCountdown] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // New state for error modal
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigation = useNavigation();

  const [containerOpacity] = useState(new Animated.Value(0));
  const [containerScale] = useState(new Animated.Value(0.9));
  const [buttonScale] = useState(new Animated.Value(1));

  const submitToApi = async (userData) => {
    try {
      const apiData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        mobile_number: userData.mobileNumber
      };

      const response = await fetch(`${BASE_URL}/register.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.status === "success") {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: 'Network error occurred. Please check your connection.' };
    }
  };

  const handleSignup = async () => {
    let isValid = true;

    setNameError('');
    setEmailError('');
    setPasswordError('');
    setMobileNumberError('');

    if (!name) {
      setNameError('Name is required.');
      isValid = false;
    } else if (!/^[a-zA-Z ]+$/.test(name)) {
      setNameError('Name should only contain letters and spaces.');
      isValid = false;
    }

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

    if (!mobileNumber) {
      setMobileNumberError('Mobile number is required.');
      isValid = false;
    } else {
      const mobilePattern = /^[789]\d{9}$/;
      if (!mobilePattern.test(mobileNumber)) {
        setMobileNumberError('Mobile number should start with 7, 8, or 9 and be 10 digits long.');
        isValid = false;
      }
    }

    if (isValid) {
      setIsLoading(true);
      try {
        const result = await submitToApi({ name, email, password, mobileNumber });
        
        if (result.success) {
          setIsCountdown(true);
          startCountdown();
        } else {
          // Show error modal instead of Alert
          setErrorMessage(result.message);
          setErrorModalVisible(true);
        }
      } catch (error) {
        // Show error modal for unexpected errors
        setErrorMessage('An unexpected error occurred. Please try again.');
        setErrorModalVisible(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 800,
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

  const closeErrorModal = () => {
    setErrorModalVisible(false);
  };

  return (
    <ImageBackground
      source={require('../assets/earth.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StarField />
      <LinearGradient
        colors={['rgba(0,0,40,0.3)', 'rgba(0,0,20,0.4)']}
        style={styles.overlay}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? -64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.signupContainer,
                { opacity: containerOpacity, transform: [{ scale: containerScale }] }
              ]}
            >
              <View style={styles.glowCircle} />
              <Text style={styles.title}>JOIN THE MISSION</Text>
              <Text style={styles.subtitle}>Begin Your Space Journey</Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                {mobileNumberError ? <Text style={styles.errorText}>{mobileNumberError}</Text> : null}
              </View>

              {isCountdown && (
                <View style={styles.countdownContainer}>
                  <Text style={styles.countdownText}>{countdown}</Text>
                </View>
              )}

              {!isCountdown && (
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity 
                    style={styles.signupButton} 
                    onPress={handleSignup}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#2196F3', '#1976D2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.signupButtonText}>
                        {isLoading ? 'PROCESSING...' : 'INITIATE SIGNUP'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              )}

              <View style={styles.footerContainer}>
                <Text style={styles.footerText}>Already have a Space Satellite account?</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                >
                  <Text style={styles.footerLink}>Return to Space Satellite Portal</Text>
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

      {/* Error Modal with Lottie Animation */}
      <ErrorModal 
        visible={errorModalVisible} 
        message={errorMessage} 
        onClose={closeErrorModal} 
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
  // New styles for keyboard handling
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  signupContainer: {
    width: '85%',
    backgroundColor: 'rgba(13,16,44,0.65)',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
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
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  inputWrapper: {
    marginBottom: 10,
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
  signupButton: {
    marginTop: 10,
    marginBottom: 10,
  },
  signupButtonText: {
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
    transform: [{ rotate: '45deg' }],
  },
  finRight: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    width: 15,
    height: 20,
    backgroundColor: '#A9A9A9',
    transform: [{ rotate: '-45deg' }],
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
  // New styles for error modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'rgba(13,16,44,0.95)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    color: '#e33241',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    width: '100%',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});

export default Signup;