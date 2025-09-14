import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LottieView from 'lottie-react-native';
import BASE_URL from '../api/Api';

const URL = `${BASE_URL}`;
const Users = () => {
  const [usersData, setUsersData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [modalType, setModalType] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${URL}/getUsers.php`);
        const data = await response.json();
        setUsersData(data);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleView = async (id) => {
    try {
      const response = await fetch(`${URL}/manageUser.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'view' }),
      });
      const data = await response.json();
      if (data.message) {
        Alert.alert('Error', data.message);
      } else {
        setUserInfo(data);
        setModalType('view');
        setModalVisible(true);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch user info');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${URL}/manageUser.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'delete' }),
      });
      const data = await response.json();
      if (data.message === 'User deleted successfully') {
        setUsersData((prevUsersData) =>
          prevUsersData.filter((user) => user.id !== id)
        );
        setModalType('delete');
        setIsSuccess(true);
        setModalVisible(true);

        setTimeout(() => setModalVisible(false), 3000);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete user');
    }
  };

  const confirmDelete = (id) => {
    setUserInfo({ id });
    setModalType('delete');
    setModalVisible(true);
  };

  const cancelModal = () => setModalVisible(false);

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>{item.email}</Text>
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => handleView(item.id)}>
          <FontAwesome name="eye" size={20} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(item.id)}>
          <FontAwesome
            name="trash"
            size={20}
            color="red"
            style={styles.deleteIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>User Management</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="blue" style={styles.loader} />
      ) : (
        <FlatList
          data={usersData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={cancelModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalType === 'view' ? (
              <>
                <LottieView
                  source={require('../assets/information.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
                {userInfo && (
                  <View style={styles.userDetails}>
                    <Text style={styles.bold}>Name: {userInfo.name}</Text>
                    <Text style={styles.bold}>Email: {userInfo.email}</Text>
                    <Text style={styles.bold}>
                      Password: {userInfo.password}
                    </Text>
                    <Text style={styles.bold}>
                      Mobile: {userInfo.mobile_number}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={cancelModal}
                  style={[styles.button, styles.cancelButton]}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : modalType === 'delete' && isSuccess ? (
              <>
                <LottieView
                  source={require('../assets/success_delete.json')}
                  autoPlay
                  loop={false}
                  style={styles.lottie}
                />
                <Text style={styles.modalText}>User deleted successfully!</Text>
              </>
            ) : (
              <>
                <LottieView
                  source={require('../assets/question.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
                <Text style={styles.modalText}>
                  Are you sure you want to delete this user?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={cancelModal}
                    style={[styles.button, styles.cancelButton]}>
                    <Text style={styles.buttonText}>No, Not Sure</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(userInfo.id)}
                    style={[styles.button, styles.confirmButton]}>
                    <Text style={styles.buttonText}>Yes, I'm Sure</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loader: { marginTop: 50 },
  userCard: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteIcon: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginVertical: 20,
    textAlign: 'center',
  },
  userDetails: {
    marginBottom: 20,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  modalButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lottie: {
    width: 200,
    height: 200,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Users;
