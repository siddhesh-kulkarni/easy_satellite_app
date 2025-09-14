import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../api/Api';

const ChangePassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modal state for displaying Lottie animations instead of alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnimationSource, setModalAnimationSource] = useState(null);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) setEmail(storedEmail);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showModal(require('../assets/error.json'), 'Failed to load user data');
      }
    };
    fetchUserData();
  }, []);

  // Helper to display the modal with the appropriate animation and message
  const showModal = (animationSource, message) => {
    setModalAnimationSource(animationSource);
    setModalMessage(message);
    setModalVisible(true);
    setTimeout(() => {
      setModalVisible(false);
    }, 2000);
  };

  // Function to update password via API
  const updatePassword = async () => {
    const apiUrl = `${BASE_URL}/admin.php`;
    const requestData = {
      email: email,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // Handle change password button press
  const handleChangePassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      showModal(require('../assets/error.json'), 'All fields are required.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal(require('../assets/error.json'), 'Please enter a valid email address.');
      return;
    }

    if (newPassword.length < 6) {
      showModal(require('../assets/error.json'), 'New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal(require('../assets/error.json'), 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword();
      if (result.status === 'yes') {
        showModal(require('../assets/success_delete.json'), 'Password changed successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        showModal(require('../assets/error.json'), result.message || 'Failed to update password.');
      }
    } catch (error) {
      showModal(require('../assets/error.json'), 'An error occurred while updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Admin Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Ionicons name="mail" size={24} color="gray" />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry={secureNew}
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
          <Ionicons name={secureNew ? 'eye-off' : 'eye'} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          secureTextEntry={secureConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
          <Ionicons name={secureConfirm ? 'eye-off' : 'eye'} size={24} color="gray" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.buttonText}>Update Password</Text>
        )}
      </TouchableOpacity>

      {/* Modal for Lottie animations */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalAnimationSource && (
              <LottieView
                source={modalAnimationSource}
                autoPlay
                loop={false}
                style={styles.lottie}
              />
            )}
            <Text style={styles.modalText}>{modalMessage}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: '#fff',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 10,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 250,
    height: 250,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  modalText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
});

export default ChangePassword;
