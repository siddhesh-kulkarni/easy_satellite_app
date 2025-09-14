import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  BackHandler,
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';
import {Card} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import Users from './Users';
import ChangePassword from './ChangePassword';
import Satellites from './Satellites';
import Review from './Review';
import BASE_URL from '../api/Api';

const CARD_WIDTH = Dimensions.get('window').width - 40;
const API_URL = `${BASE_URL}/satellite.php`;
const USER_API_URL = `${BASE_URL}/getUsers.php`;
const REVIEWS_API_URL = `${BASE_URL}/reviews.php`;

const Drawer = createDrawerNavigator();

// LottieModal Component for Error Messages
// Modify the LottieModal component definition to properly handle onConfirm
function LottieModal({visible, type, message, onClose, onConfirm}) {
  const animation = useRef(null);
  const [source, setSource] = useState(null);

  useEffect(() => {
    if (visible) {
      if (type === 'error') {
        setSource(require('../assets/error.json'));
      } else if (type === 'logout') {
        setSource(require('../assets/logout.json'));
      }

      if (animation.current) {
        animation.current.play();
      }
    }
  }, [visible, type]);

  // Function to safely handle the confirm action
  const handleConfirm = () => {
    if (typeof onConfirm === 'function') {
      onConfirm();
    } else {
      console.warn('onConfirm is not a function or not provided');
      onClose(); // Fallback to just closing if onConfirm is missing
    }
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.lottieContainer}>
            {source && (
              <LottieView
                ref={animation}
                source={source}
                autoPlay
                loop={true}
                style={styles.lottieAnimation}
              />
            )}
          </View>
          <Text style={styles.modalTitle}>
            {type === 'error' ? 'Error' : 'Confirm Logout'}
          </Text>
          <Text style={styles.modalMessage}>{message}</Text>

          {type === 'logout' ? (
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}>
                <Text style={styles.cancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Yes, I'm</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.modalButton, styles.okButton]}
              onPress={onClose}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function CustomDrawerContent(props) {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Function to handle back button press
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (props.state.index === 0) {
          // Only show logout modal if we're on the main screen (Dashboard)
          setShowLogoutModal(true);
          return true; // Prevent default behavior
        }
        return false; // Let the default back action happen
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [props.state.index]),
  );

  const handleLogout = async () => {
    if (isNavigating) return;

    try {
      setIsNavigating(true);
      setIsLoading(true);

      const id = await AsyncStorage.getItem('userId');
      const userType = await AsyncStorage.getItem('userType');
      await AsyncStorage.multiRemove(['userId', 'userType', 'isLoggedIn']);
      console.log('UserId:', id);
      console.log('UserType', userType);
      console.log('User logged out successfully.');

      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      setErrorMessage('Failed to logout. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
      setIsNavigating(false);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerHeader}>
          <Image
            source={require('../assets/earth.jpg')}
            style={styles.drawerImage}
          />
          <Text style={styles.drawerTitle}>Admin Panel</Text>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
        disabled={isLoading}>
        <Ionicons name="log-out-outline" size={24} color="white" />
        <Text style={styles.logoutButtonText}>
          {isLoading ? 'Logging out...' : 'Logout'}
        </Text>
      </TouchableOpacity>

      {/* Logout Confirmation Modal */}
      <LottieModal
        visible={showLogoutModal}
        type="logout"
        message="Are you sure you want to logout?"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout} // Make sure this is passed properly
      />

      {/* Error Modal */}
      <LottieModal
        visible={showErrorModal}
        type="error"
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  );
}

// Reviews Carousel Component with fixed styling
function ReviewsCarousel({reviews, isLoading}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  // Auto scroll carousel
  useEffect(() => {
    let intervalId;
    if (reviews.length > 1 && !isLoading) {
      intervalId = setInterval(() => {
        const nextIndex = (currentIndex + 1) % reviews.length;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * CARD_WIDTH,
          animated: true,
        });
      }, 5000); // Change slide every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [currentIndex, reviews.length, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.carouselContainer}>
        <Text style={styles.reviewsTitle}>Recent Reviews</Text>
        <View style={styles.loadingReview}>
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.carouselContainer}>
        <Text style={styles.reviewsTitle}>Recent Reviews</Text>
        <View style={styles.emptyReview}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#999" />
          <Text style={styles.emptyReviewText}>No reviews found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      <Text style={styles.reviewsTitle}>Recent Reviews</Text>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={event => {
          const newIndex = Math.floor(
            event.nativeEvent.contentOffset.x / CARD_WIDTH,
          );
          setCurrentIndex(newIndex);
        }}>
        {reviews.map((review, index) => (
          <Card key={review.id} style={styles.reviewCard}>
            <Card.Content>
              <View style={styles.reviewHeader}>
                <View style={styles.userInfo}>
                  <Ionicons name="person-circle" size={24} color="#2196F3" />
                  <Text style={styles.userName}>{review.name}</Text>
                </View>
                <View style={styles.starsContainer}>
                  {Array.from({length: 5}).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < review.stars ? 'star' : 'star-outline'}
                      size={16}
                      color={i < review.stars ? '#FFD700' : '#ccc'}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewDate}>
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
              <Text style={styles.reviewFeedback}>{review.feedback}</Text>
              <Text style={styles.reviewEmail}>{review.email}</Text>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {reviews.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              currentIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function AdminDashboardScreen() {
  const [selectedOrbit, setSelectedOrbit] = useState('All');
  const [animatedValue] = useState(new Animated.Value(0));
  const [satelliteData, setSatelliteData] = useState({
    All: {total: 0, active: 0, inactive: 0, users: 0},
    LEO: {total: 0, active: 0, inactive: 0, users: 0},
    MEO: {total: 0, active: 0, inactive: 0, users: 0},
    GEO: {total: 0, active: 0, inactive: 0, users: 0},
  });
  const [currentData, setCurrentData] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const isMounted = useRef(true);

  // Function to show error modal
  const showError = message => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // Function to fetch reviews
  const fetchReviews = async () => {
    if (!isMounted.current) return;

    try {
      setIsReviewsLoading(true);
      const response = await fetch(REVIEWS_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && Array.isArray(result.data)) {
        if (isMounted.current) {
          setReviews(result.data);
          console.log('Fetched reviews:', result.data.length);
        }
      } else {
        console.log('Reviews API did not return expected data:', result);
        if (isMounted.current) {
          setReviews([]);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      if (isMounted.current) {
        setReviews([]);
      }
    } finally {
      if (isMounted.current) {
        setIsReviewsLoading(false);
      }
    }
  };

  // Function to fetch data in a specific order to ensure user count is loaded first
  const fetchAllData = async () => {
    if (!isMounted.current) return;

    try {
      setIsLoading(true);

      // 1. First, fetch user count
      const userCountData = await fetchUserCount();

      // 2. Then fetch satellite data with the user count
      await fetchSatelliteData(userCountData);

      // 3. Finally, fetch reviews
      await fetchReviews();

      if (isMounted.current) {
        setIsDataInitialized(true);
      }
    } catch (error) {
      console.error('Error fetching all data:', error);
      showError('Failed to load data. Please try again.');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Function to fetch user count from your PHP API
  const fetchUserCount = async () => {
    if (!isMounted.current) return 0;

    try {
      const response = await fetch(USER_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const userData = await response.json();
      let count = 0;

      if (Array.isArray(userData)) {
        // Get the actual count from the array length
        count = userData.length;
        console.log('Fetched user count:', count);
      } else if (userData.count !== undefined) {
        // If not an array but has a count property
        count = userData.count;
      } else {
        console.log('User API did not return an array or count:', userData);
      }

      if (isMounted.current) {
        setUserCount(count);
      }

      return count;
    } catch (error) {
      console.error('Error fetching user count:', error);
      return userCount; // Return current count on error
    }
  };

  // Function to fetch satellite data with the current user count
  const fetchSatelliteData = async currentUserCount => {
    if (!isMounted.current) return;

    try {
      // Use the passed user count or the state value as fallback
      const usersCount =
        currentUserCount !== undefined ? currentUserCount : userCount;

      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.status === 'success' && result.data) {
        const satellites = result.data;

        // Process the data to organize by orbit
        const processedData = {
          All: {total: 0, active: 0, inactive: 0, users: usersCount},
          LEO: {total: 0, active: 0, inactive: 0, users: usersCount},
          MEO: {total: 0, active: 0, inactive: 0, users: usersCount},
          GEO: {total: 0, active: 0, inactive: 0, users: usersCount},
        };

        // Process each satellite
        satellites.forEach(satellite => {
          // Map orbit_type from your API to our categories
          let orbitCategory = 'All';

          if (satellite.orbit_type) {
            // Check if orbit_type contains LEO, MEO, GEO
            if (satellite.orbit_type.includes('LEO')) {
              orbitCategory = 'LEO';
            } else if (satellite.orbit_type.includes('MEO')) {
              orbitCategory = 'MEO';
            } else if (satellite.orbit_type.includes('GEO')) {
              orbitCategory = 'GEO';
            }
          }

          // Check if satellite is active (active = "1") or inactive (active = "0")
          const isActive = satellite.active === '1';

          // Update the All category
          processedData.All.total += 1;
          processedData.All.active += isActive ? 1 : 0;
          processedData.All.inactive += isActive ? 0 : 1;

          // Update the specific orbit category if it matches
          if (orbitCategory !== 'All') {
            processedData[orbitCategory].total += 1;
            processedData[orbitCategory].active += isActive ? 1 : 0;
            processedData[orbitCategory].inactive += isActive ? 0 : 1;
          }
        });

        console.log('Processed satellite data with user count:', usersCount);

        if (isMounted.current) {
          setSatelliteData(processedData);
          setCurrentData(processedData[selectedOrbit]);
        }
      } else {
        console.log('API returned error or no data:', result);

        // Use default data with current user count if API fails
        const fallbackData = {
          All: {total: 0, active: 0, inactive: 0, users: usersCount},
          LEO: {total: 0, active: 0, inactive: 0, users: usersCount},
          MEO: {total: 0, active: 0, inactive: 0, users: usersCount},
          GEO: {total: 0, active: 0, inactive: 0, users: usersCount},
        };

        if (isMounted.current) {
          setSatelliteData(fallbackData);
          setCurrentData(fallbackData[selectedOrbit]);
        }
      }
    } catch (error) {
      console.error('Error fetching satellite data:', error);

      // Use current user count for fallback data
      const usersCount =
        currentUserCount !== undefined ? currentUserCount : userCount;

      // Use empty data with current user count in case of error
      const fallbackData = {
        All: {total: 0, active: 0, inactive: 0, users: usersCount},
        LEO: {total: 0, active: 0, inactive: 0, users: usersCount},
        MEO: {total: 0, active: 0, inactive: 0, users: usersCount},
        GEO: {total: 0, active: 0, inactive: 0, users: usersCount},
      };

      if (isMounted.current) {
        setSatelliteData(fallbackData);
        setCurrentData(fallbackData[selectedOrbit]);
      }
    }
  };

  // Handle refreshing all data
  const handleRefresh = () => {
    fetchAllData();
  };

  // Initial load effect
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Fetch all data in the correct order
    fetchAllData();

    // Optional: Set up a refresh interval
    const intervalId = setInterval(handleRefresh, 60000); // Refresh every minute

    return () => {
      clearInterval(intervalId);
      isMounted.current = false;
    };
  }, []);

  // Effect for orbit selection change
  useEffect(() => {
    if (isMounted.current && isDataInitialized) {
      setCurrentData(satelliteData[selectedOrbit]);
    }
  }, [selectedOrbit, satelliteData, isDataInitialized]);

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Animated.View style={[styles.welcomeCard, {opacity: animatedValue}]}>
          <ImageBackground
            source={require('../assets/earth.jpg')}
            style={styles.cardBackground}
            imageStyle={styles.imageBackgroundStyle}>
            <Ionicons name="person-circle-outline" size={60} color="white" />
            <Text style={styles.welcomeText}>Welcome, Admin</Text>
          </ImageBackground>
        </Animated.View>

        <View style={styles.cardsContainer}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: '#ff9800',
                transform: [{scale: animatedValue}],
              },
            ]}>
            <Ionicons name="planet-outline" size={35} color="white" />
            <Text style={styles.cardTitle}>Total Satellites</Text>
            <Text style={styles.cardValue}>
              {isLoading ? '...' : currentData.total}
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: '#4caf50',
                transform: [{scale: animatedValue}],
              },
            ]}>
            <Ionicons name="stats-chart-outline" size={35} color="white" />
            <Text style={styles.cardTitle}>Active / Inactive</Text>
            <Text style={styles.cardValue}>
              {isLoading
                ? '...'
                : `${currentData.active} / ${currentData.inactive}`}
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.card,
            styles.largeCard,
            {
              backgroundColor: '#e91e63',
              transform: [{scale: animatedValue}],
            },
          ]}>
          <Ionicons name="people-outline" size={35} color="white" />
          <Text style={styles.cardTitle}>Total Users</Text>
          <Text style={styles.cardValue}>
            {isLoading ? '...' : currentData.users}
          </Text>
        </Animated.View>

        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Select Satellite by Orbit</Text>
          <Picker
            selectedValue={selectedOrbit}
            onValueChange={itemValue => setSelectedOrbit(itemValue)}
            style={styles.picker}>
            <Picker.Item label="All" value="All" />
            <Picker.Item label="LEO" value="LEO" />
            <Picker.Item label="MEO" value="MEO" />
            <Picker.Item label="GEO" value="GEO" />
          </Picker>
        </View>

        <View style={styles.refreshButtonContainer}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isLoading}>
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text style={styles.refreshButtonText}>
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reviews Carousel */}
        <ReviewsCarousel reviews={reviews} isLoading={isReviewsLoading} />

        {/* Error Modal */}
        <LottieModal
          visible={showErrorModal}
          type="error"
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </View>
    </ScrollView>
  );
}

// Main Component
function AdminDashboardWrapper() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigation = useNavigation();

  // Handle back button press at the navigator level
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setShowLogoutModal(true);
        return true; // Prevent default behavior
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userId', 'userType', 'isLoggedIn']);
      console.log('User logged out successfully.');

      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      <AdminDashboardScreen />

      {/* Global Logout Modal */}
      <LottieModal
        visible={showLogoutModal}
        type="logout"
        message="Are you sure you want to logout?"
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
      />
    </>
  );
}

export default function AdminDashboard() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="Admin Dashboard"
        component={AdminDashboardWrapper}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Satellites"
        component={Satellites}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="planet" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Change Password"
        component={ChangePassword}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="lock-closed-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Users"
        component={Users}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reviews"
        component={Review}
        options={{
          drawerIcon: ({color, size}) => (
            <Ionicons name="star-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  welcomeCard: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  drawerHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  drawerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
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
  cardBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    padding: 20,
  },
  imageBackgroundStyle: {
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 2},
    elevation: 6,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  largeCard: {
    width: '100%',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  cardValue: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  picker: {
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 5,
  },
  refreshButtonContainer: {
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  okButton: {
    backgroundColor: '#2196F3',
    width: '100%',
  },
  okButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
    marginLeft: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Reviews Carousel Styles
  carouselContainer: {
    marginTop: 10,
    // marginBottom: 20,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  carouselContent: {
    paddingRight: 20,
  },
  reviewCard: {
    width: CARD_WIDTH,
    marginRight: 0,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  reviewFeedback: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewEmail: {
    fontSize: 12,
    color: '#888',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#2196F3',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  loadingReview: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    height: 150,
    width: CARD_WIDTH,
  },
  loadingText: {
    color: '#666',
  },
  emptyReview: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    height: 150,
    width: CARD_WIDTH,
  },
  emptyReviewText: {
    color: '#666',
    marginTop: 10,
  },
});
