import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import BASE_URL from '../api/Api';

const API_URL = `${BASE_URL}/satellite.php`;

const Satellites = ({navigation}) => {
  const [satellites, setSatellites] = useState([]);
  const [selectedOrbit, setSelectedOrbit] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [satelliteToDelete, setSatelliteToDelete] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  const fetchSatellites = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();

      if (result.status === 'success') {
        setSatellites(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch satellites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSatellites();
    setRefreshing(false);
  };

  // Initial data fetch when component mounts
  useEffect(() => {
    fetchSatellites();
  }, []);

  // Fetch data whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, fetching latest data');
      fetchSatellites();
      return () => {
        // This runs when the screen goes out of focus
        console.log('Screen unfocused');
      };
    }, [])
  );

  const toggleStatus = async satellite => {
    console.log('Current satellite status:', satellite.active);

    try {
      const updatedSatellite = {
        ...satellite,
        active: satellite.active === '1' ? '0' : '1',
      };

      console.log('Sending updated satellite data:', updatedSatellite);

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSatellite),
      });

      const result = await response.json();
      console.log('Toggle status response:', result);

      if (result.status === 'success') {
        setSatellites(
          satellites.map(sat =>
            sat.satellite_id === satellite.satellite_id
              ? updatedSatellite
              : sat,
          ),
        );
      } else {
        Alert.alert('Error', result.message);
        await fetchSatellites();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update satellite status');
      console.error('Toggle status error:', err);
      await fetchSatellites();
    }
  };

  const handleDelete = satellite_id => {
    console.log('Delete Satellite:', satellite_id);
    setSatelliteToDelete(satellite_id);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({satellite_id: satelliteToDelete}),
      });

      const result = await response.json();
      console.log('Delete response:', result);

      if (result.status === 'success') {
        setSatellites(
          satellites.filter(sat => sat.satellite_id !== satelliteToDelete),
        );
        setDeleteModalVisible(false);
        setShowDeleteSuccess(true);
        
        // Hide success animation after 2 seconds
        setTimeout(() => {
          setShowDeleteSuccess(false);
        }, 2000);
      } else {
        setDeleteModalVisible(false);
        Alert.alert('Error', result.message);
      }
    } catch (err) {
      setDeleteModalVisible(false);
      Alert.alert('Error', 'Failed to delete satellite');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setSatelliteToDelete(null);
  };

  const handleEdit = satellite => {
    navigation.navigate('UpdateSatellites', {satellite});
    console.log('Update Satellite: ', satellite);
  };

  const handleView = satellite => {
    setSelectedSatellite(satellite);
    setModalVisible(true);
    console.log('View Satellite:', satellite);
  };

  const handleAddSatellite = () => {
    if (selectedOrbit !== 'All') {
      console.log('Selected Category:', selectedOrbit);
      navigation.navigate('AddSatellites', {
        selectedOrbit: selectedOrbit // Passing the selected orbit as a parameter
      });
    } else {
      Alert.alert(
        'Select Category',
        'Please select a specific orbit category (LEO, MEO, or GEO) before adding a satellite.',
      );
    }
  };

  const filteredSatellites =
    selectedOrbit === 'All'
      ? satellites
      : satellites.filter(sat => sat.orbit_type === selectedOrbit);

  const totalSatellites = satellites.length;
  const leoCount = satellites.filter(sat => sat.orbit_type === 'LEO').length;
  const meoCount = satellites.filter(sat => sat.orbit_type === 'MEO').length;
  const geoCount = satellites.filter(sat => sat.orbit_type === 'GEO').length;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const DeleteConfirmationModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={deleteModalVisible}
      onRequestClose={cancelDelete}>
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModalContent}>
          <View style={styles.lottieContainer}>
            <LottieView
              source={require('../assets/question.json')}
              autoPlay
              loop
              style={styles.lottieQuestion}
            />
          </View>
          <Text style={styles.deleteModalTitle}>Delete Satellite</Text>
          <Text style={styles.deleteModalText}>
            Are you sure you want to delete this satellite?
          </Text>
          <View style={styles.deleteButtonsContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, styles.cancelButton]}
              onPress={cancelDelete}>
              <Text style={styles.deleteButtonText}>Not Sure</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, styles.confirmButton]}
              onPress={confirmDelete}>
              <Text style={styles.deleteButtonText}>Yes Sure</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const DeleteSuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showDeleteSuccess}
      onRequestClose={() => setShowDeleteSuccess(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContent}>
          <LottieView
            source={require('../assets/success_delete.json')}
            autoPlay
            loop={false}
            style={styles.lottieSuccess}
          />
          <Text style={styles.successModalText}>
            Satellite deleted successfully
          </Text>
        </View>
      </View>
    </Modal>
  );

  const SatelliteDetailModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Satellite Details</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedSatellite && (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}>
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.satellite_id}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.satellite_name}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nickname:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.nickname || 'N/A'}
                  </Text>
                </View>

                {/* Modified Description Row */}
                <View style={styles.descriptionRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>
                      {selectedSatellite.description || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color:
                          selectedSatellite.active === '1'
                            ? '#4CAF50'
                            : '#FF5733',
                      },
                    ]}>
                    {selectedSatellite.active === '1' ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Orbit Type:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.orbit_type}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purpose:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.purpose}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Users:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.users}
                  </Text>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Launch Information</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Launch Date:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.launch_date}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Launch Year:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.launch_year}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Launch Site:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.launch_site}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Launch Vehicle:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.launch_vehicle}
                  </Text>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Contractor Information
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contractor:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.contractor}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contractor Country:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.contractor_country}
                  </Text>
                </View>

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Ownership & Operation</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Operator/Owner:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.operator_owner}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Country (Owner):</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.country_operator_owner}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>UN Registry:</Text>
                  <Text style={styles.detailValue}>
                    {selectedSatellite.country_org_un_registry}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expected Lifetime:</Text>
                  <Text
                    style={
                      styles.detailValue
                    }>{`${selectedSatellite.expected_lifetime_yrs} years`}</Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSatellites}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Satellite Management</Text>

      <View style={styles.filterContainer}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedOrbit}
            onValueChange={setSelectedOrbit}
            style={styles.picker}>
            <Picker.Item label="All" value="All" />
            <Picker.Item label="LEO" value="LEO" />
            <Picker.Item label="MEO" value="MEO" />
            <Picker.Item label="GEO" value="GEO" />
          </Picker>
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            selectedOrbit === 'All' && styles.addButtonDisabled,
          ]}
          onPress={handleAddSatellite}
          disabled={selectedOrbit === 'All'}>
          <Ionicons
            name="add-circle"
            size={28}
            color={selectedOrbit === 'All' ? '#A0A0A0' : '#4CAF50'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>Total: {totalSatellites}</Text>
        <Text style={styles.countText}>LEO: {leoCount}</Text>
        <Text style={styles.countText}>MEO: {meoCount}</Text>
        <Text style={styles.countText}>GEO: {geoCount}</Text>
      </View>

      {filteredSatellites.length > 0 ? (
        <FlatList
          data={filteredSatellites}
          keyExtractor={item => item.satellite_id.toString()}
          style={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text
                style={styles.cardTitle}
                numberOfLines={1}
                ellipsizeMode="tail">
                {item.satellite_name}
              </Text>

              <View style={styles.iconContainer}>
                <TouchableOpacity onPress={() => handleEdit(item)}>
                  <MaterialIcons name="edit" size={22} color="#2196F3" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleView(item)}>
                  <MaterialIcons name="visibility" size={22} color="#FFC107" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(item.satellite_id)}>
                  <MaterialIcons name="delete" size={22} color="#FF5733" />
                </TouchableOpacity>

                <View style={styles.statusContainer}>
                  <Switch
                    value={item.active === '1'}
                    onValueChange={() => toggleStatus(item)}
                    trackColor={{false: '#E0E0E0', true: '#E0E0E0'}} // Gray when off, Green when on
                    thumbColor={item.active === '1' ? '#007AFF' : '#B0B0B0'} // Blue when on, Gray when off
                  />
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No satellites found</Text>
      )}
      <SatelliteDetailModal />
      <DeleteConfirmationModal />
      <DeleteSuccessModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    paddingVertical: 5,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  picker: {
    fontSize: 18,
    color: '#000',
  },
  addButton: {
    marginLeft: 10,
    padding: 5,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#444',
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
    overflow: 'hidden',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5733',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingRight: 14
  },
  // New styles for description
  descriptionRow: {
    flexDirection: 'column',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  descriptionContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  // Delete confirmation modal styles
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  lottieContainer: {
    height: 100,
    width: 100,
    marginBottom: 10,
  },
  lottieQuestion: {
    height: 100,
    width: 100,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9e9e9e',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Success modal styles
  successModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  lottieSuccess: {
    height: 150,
    width: 150,
  },
  successModalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
});

export default Satellites;