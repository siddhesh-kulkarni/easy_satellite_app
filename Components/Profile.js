import {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../api/Api';

const API_URL = `${BASE_URL}/profile.php`; // Replace with your API URL

// Screen wrapper component remains the same
const ScreenWrapper = ({children}) => {
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

// Success Modal Component
const SuccessModal = ({visible, onClose}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LottieView
            source={require('../assets/Rocket_new.json')}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
            onAnimationFinish={onClose}
          />
          <Text style={styles.successText}>Profile Updated Successfully!</Text>
        </View>
      </View>
    </Modal>
  );
};

// Profile Content Component
const ProfileContent = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    mobile_number: '',
  });
  const [backupProfile, setBackupProfile] = useState({...profile});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        // Handle case where user is not logged in
        navigation.navigate('Login');
        return;
      }
      console.log('Profile Screen', userId);
      // Append user_id as a query parameter
      const response = await fetch(`${API_URL}?user_id=${userId}`);
      const data = await response.json();

      // Since the PHP returns a single JSON object, no need to use find()
      if (data && data.id) {
        setProfile({
          id: data.id,
          name: data.name,
          email: data.email,
          password: data.password,
          mobile_number: data.mobile_number,
        });
        setBackupProfile({...data});
      } else {
        console.error('User not found or invalid data:', data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const validateFields = () => {
    const newErrors = {};
    if (!profile.name.trim()) {
      newErrors.name = 'Name is required.';
    }
    if (!/^[a-zA-Z ]+$/.test(profile.name.trim())) {
      newErrors.name = 'Name should contain only letters.';
    }
    if (!profile.email.trim() || !/\S+@\S+\.\S+/.test(profile.email.trim())) {
      newErrors.email = 'Enter a valid email.';
    }
    if (profile.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!/^\d{10}$/.test(profile.mobile_number)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number.';
    }
    return newErrors;
  };

  const handleEditToggle = () => {
    setBackupProfile({...profile});
    setIsEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setProfile({...backupProfile});
    setIsEditing(false);
    setErrors({});
  };

  const handleUpdate = async () => {
    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          password: profile.password,
          mobileNumber: profile.mobile_number,
        }),
      });

      const result = await response.json();

      if (result.status === 'yes') {
        setErrors({});
        setIsEditing(false);
        setBackupProfile({...profile});
        setShowSuccessModal(true);
      } else {
        setErrors({submit: result.message});
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // setErrors({submit: 'Failed to update profile. Please try again.'});
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setProfile(prev => ({...prev, [key]: value}));
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/11412/11412005.png',
            }}
            style={styles.profileImage}
          />

          <View style={styles.field}>
            <Ionicons name="person-outline" size={20} color="#007AFF" />
            <TextInput
              style={[styles.input, isEditing && styles.editable]}
              value={profile.name}
              editable={isEditing}
              onChangeText={value => handleChange('name', value)}
              placeholder="Name"
            />
          </View>
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <View style={styles.field}>
            <Ionicons name="mail-outline" size={20} color="#007AFF" />
            <TextInput
              style={[styles.input, isEditing && styles.editable]}
              value={profile.email}
              editable={isEditing}
              onChangeText={value => handleChange('email', value)}
              placeholder="Email"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View style={[styles.field, styles.passwordContainer]}>
            <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
            <TextInput
              style={[styles.passwordInput, isEditing && styles.editable]}
              value={profile.password}
              editable={isEditing}
              secureTextEntry={!isPasswordVisible}
              onChangeText={value => handleChange('password', value)}
              placeholder="Password"
            />
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <View style={styles.field}>
            <Ionicons name="call-outline" size={20} color="#007AFF" />
            <TextInput
              style={[styles.input, isEditing && styles.editable]}
              value={profile.mobile_number}
              editable={isEditing}
              onChangeText={value => handleChange('mobile_number', value)}
              placeholder="Mobile"
            />
          </View>
          {errors.mobile && (
            <Text style={styles.errorText}>{errors.mobile}</Text>
          )}
          {errors.submit && (
            <Text style={styles.errorText}>{errors.submit}</Text>
          )}

          <View style={styles.buttonContainer}>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleEditToggle}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.updateButton]}
                  onPress={handleUpdate}>
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </KeyboardAvoidingView>
  );
};

// Main Profile Component
const Profile = () => {
  return (
    <ScreenWrapper>
      <ProfileContent />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 20,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '100%',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  editable: {
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
  },
  passwordContainer: {
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  updateButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: Dimensions.get('window').width * 0.8,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 10,
  },
});

export default Profile;
