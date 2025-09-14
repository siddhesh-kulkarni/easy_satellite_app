import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import  Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import BASE_URL from '../api/Api';

// Base URL for your API
const API_URL = `${BASE_URL}/reviews.php`; 

const ScreenWrapper = ({ children }) => {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Ionicons name="menu-outline" size={22} color="#fff" />
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>{children}</View>
    </SafeAreaView>
  );
};

const Drawer = createDrawerNavigator();

const starRatings = ['Poor', 'Bad', 'Good', 'Very Good', 'Excellent'];

const LottieAlert = ({ visible, onClose, type, message }) => {
  const lottieRef = useRef(null);
  
  useEffect(() => {
    if (visible && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LottieView
            ref={lottieRef}
            style={styles.lottieAnimation}
            source={type === 'success' ? require('../assets/success_delete.json') : require('../assets/error.json')}
            autoPlay={false}
            loop={false}
          />
          <Text style={[
            styles.modalText, 
            type === 'success' ? styles.successText : styles.errorText
          ]}>
            {message}
          </Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const RateApp = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isEditing, setIsEditing] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackCounter, setFeedbackCounter] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  
  // For lottie alert modal
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');

  // Show custom lottie alert
  const showLottieAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Fetch user data from AsyncStorage when component mounts
  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedEmail = await AsyncStorage.getItem('userEmail');
        console.log(setUserEmail);
        if (storedUserId) {
          setUserId(parseInt(storedUserId));
        }
        
        if (storedEmail) {
          setUserEmail(storedEmail);
        }
        
        // Fetch user's reviews if user is logged in
        if (storedUserId) {
          fetchUserReviews(storedUserId);
        }
      } catch (error) {
        console.error('Error getting user data from storage:', error);
      }
    };
    
    getUserData();
  }, []);

  // Fetch user reviews from the API
  const fetchUserReviews = async (userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data && result.data.length > 0) {
        // Transform API data to match your local format
        const transformedData = result.data.map(item => ({
          id: item.id,
          rating: item.stars,
          review: item.feedback,
          date: item.updated_at
        }));
        
        setFeedbackList(transformedData);
        
        // Show the most recent feedback
        const mostRecent = transformedData[0]; // Assuming data is sorted DESC
        setFeedback(mostRecent);
        setShowFeedbackHistory(true);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = async () => {
    if (rating === 0) {
      showLottieAlert('error', 'Please select a star rating before submitting.');
      return;
    }
    if (review.trim() === '') {
      showLottieAlert('error', 'Please write a review before submitting.');
      return;
    }
    
    if (!userId) {
      showLottieAlert('error', 'Please login to submit feedback.');
      return;
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsLoading(true);
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing review with PUT request
        response = await fetch(API_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: feedback.id,
            stars: rating,
            feedback: review
          }),
        });
      } else {
        // Create new review with POST request
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            email: userEmail,
            stars: rating,
            feedback: review
          }),
        });
      }
      
      const result = await response.json();
      
      if (result.status === 'success') {
        const newFeedback = {
          id: isEditing ? feedback.id : result.data?.id || feedbackCounter,
          rating,
          review,
          date: new Date().toLocaleString(),
        };

        if (isEditing) {
          setFeedbackList((prevList) =>
            prevList.map((f) => (f.id === newFeedback.id ? newFeedback : f))
          );
        } else {
          setFeedbackList((prevList) => [newFeedback, ...prevList]);
          setFeedbackCounter((prevCount) => prevCount + 1);
        }

        setFeedback(newFeedback);
        setIsEditing(false);

        showLottieAlert(
          'success', 
          isEditing
            ? 'Your feedback has been updated successfully!'
            : 'Thank you! Your feedback has been submitted successfully!'
        );
        
        setShowFeedbackHistory(true);
      } else {
        showLottieAlert('error', result.message || 'Failed to submit feedback.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showLottieAlert('error', 'Failed to submit feedback. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setRating(feedback.rating);
    setReview(feedback.review);
    setIsEditing(true);
    setShowFeedbackHistory(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}
      
      {/* Lottie Alert Modal */}
      <LottieAlert 
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        type={alertType}
        message={alertMessage}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled">
        {!showFeedbackHistory ? (
          <>
            <Text style={styles.heading}>Rate the Satellite App</Text>
            <Text style={styles.subheading}>
              Your feedback helps improve our space insights!
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Select Rating</Text>
              <View style={styles.starsContainer}>
                {starRatings.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() =>
                      setRating(rating === index + 1 ? index : index + 1)
                    }>
                    <Animated.View
                      style={{
                        transform: [{ scale: rating === index + 1 ? 1.2 : 1 }],
                      }}>
                      <Icon
                        name={index < rating ? 'star' : 'star-o'}
                        size={35}
                        color={index < rating ? '#FFD700' : '#ccc'}
                        style={styles.star}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingText}>{starRatings[rating - 1]}</Text>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Write a Review</Text>
              <TextInput
                style={styles.input}
                placeholder="Share your experience..."
                multiline
                value={review}
                onChangeText={setReview}
              />
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Text style={styles.buttonText}>
                  {isEditing ? 'Update Feedback' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackHeading}>Your Feedback</Text>
            <ScrollView style={styles.scrollView}>
              {feedback && (
                <View style={styles.card}>
                  <View style={styles.feedbackHeaderContent}>
                    <View style={styles.feedbackStarsContainer}>
                      <View style={styles.feedbackStars}>
                        {starRatings.map((_, index) => (
                          <Icon
                            key={index}
                            name={index < feedback.rating ? 'star' : 'star-o'}
                            size={24}
                            color={index < feedback.rating ? '#FFD700' : '#ccc'}
                            style={styles.star}
                          />
                        ))}
                      </View>
                      <Text style={styles.feedbackRatingText}>
                        {starRatings[feedback.rating - 1]}
                      </Text>
                    </View>
                    
                    {/* Modified feedback text container */}
                    <View style={styles.feedbackTextContainer}>
                      <View style={styles.feedbackTextWrapper}>
                        <Text style={styles.feedbackText}>{feedback.review}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleEdit}
                        style={styles.feedbackEditIcon}>
                        <Icon name="edit" size={24} color="blue" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.feedbackDate}>{feedback.date}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    // backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60 ,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  contentContainer: {
    flex: 1,
  },
  menuButton: {
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  menuText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    // backgroundColor: '#fff',
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 25,
  },
  subheading: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 25,
    borderRadius: 12,
    width: '95%',
    alignSelf: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#444',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    marginHorizontal: 8,
    color: 'gold',
  },
  ratingText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 140,
    borderWidth: 1,
    borderColor: 'gold',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 40,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    padding: 20,
  },
  feedbackHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  feedbackStarsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedbackStars: {
    flexDirection: 'row',
  },
  feedbackRatingText: {
    marginBottom: 8,
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  feedbackDate: {
    marginTop: 5,
    fontSize: 12,
    color: '#888',
  },
  feedbackHeaderContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Modified styles for feedback text and edit button
  feedbackTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 10,
  },
  feedbackTextWrapper: {
    flex: 1,
    paddingRight: 10,
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
  },
  feedbackEditIcon: {
    padding: 5,
    marginLeft: 10,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  // Lottie modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 20,
  },
  successText: {
    color: '#28a745',
  },
  errorText: {
    color: '#dc3545',
  },
  modalButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const RateAppDrawer = () => {
  return (
    <ScreenWrapper>
      <RateApp />
    </ScreenWrapper>
  );
};

export default RateAppDrawer;