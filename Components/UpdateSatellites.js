import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { Picker } from '@react-native-picker/picker';
import LottieView from 'lottie-react-native';
import BASE_URL from '../api/Api';

const API_URL = `${BASE_URL}/satellite.php`; // Replace with your actual API URL

const UpdateSatellites = ({ navigation, route }) => {
  const satelliteData = route.params?.satellite || null;

  const [satellite_id, setSatelliteId] = useState('');
  const [satellite_name, setSatelliteName] = useState('');
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [country_org_un_registry, setCountryOrgUnRegistry] = useState('');
  const [country_operator_owner, setCountryOperatorOwner] = useState('');
  const [operator_owner, setOperatorOwner] = useState('');
  const [users, setUsers] = useState('');
  const [purpose, setPurpose] = useState('');
  const [orbit_type, setOrbitType] = useState('');
  const [launch_date, setLaunchDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [launch_year, setLaunchYear] = useState('');
  const [expected_lifetime_yrs, setExpectedLifetime] = useState('');
  const [contractor, setContractor] = useState('');
  const [contractor_country, setContractorCountry] = useState('');
  const [launch_site, setLaunchSite] = useState('');
  const [launch_vehicle, setLaunchVehicle] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const successAnimationRef = useRef(null);
  const errorAnimationRef = useRef(null);

  // Load satellite data when component mounts
  useEffect(() => {
    if (satelliteData) {
      setSatelliteId(satelliteData.satellite_id?.toString() || '');
      setSatelliteName(satelliteData.satellite_name || '');
      setNickname(satelliteData.nickname || '');
      setDescription(satelliteData.description || '');
      setCountryOrgUnRegistry(satelliteData.country_org_un_registry || '');
      setCountryOperatorOwner(satelliteData.country_operator_owner || '');
      setOperatorOwner(satelliteData.operator_owner || '');
      setUsers(satelliteData.users || '');
      setPurpose(satelliteData.purpose || '');
      setOrbitType(satelliteData.orbit_type || '');

      // Parse launch date if available
      if (satelliteData.launch_date) {
        try {
          setLaunchDate(new Date(satelliteData.launch_date));
        } catch (e) {
          console.error('Invalid date format:', e);
          setLaunchDate(new Date());
        }
      }

      setLaunchYear(satelliteData.launch_year?.toString() || '');
      setExpectedLifetime(satelliteData.expected_lifetime_yrs?.toString() || '');
      setContractor(satelliteData.contractor || '');
      setContractorCountry(satelliteData.contractor_country || '');
      setLaunchSite(satelliteData.launch_site || '');
      setLaunchVehicle(satelliteData.launch_vehicle || '');
    }
  }, [satelliteData]);

  const validateInputs = () => {
    let newErrors = {};
    const numberRegex = /^[0-9]+$/;

    // Validate Satellite ID
    if (!satellite_id) {
      newErrors.satellite_id = 'Satellite ID is required.';
    } else if (!numberRegex.test(satellite_id)) {
      newErrors.satellite_id = 'Satellite ID must contain only numbers.';
    }

    // Validate Expected Lifetime
    if (!expected_lifetime_yrs) {
      newErrors.expected_lifetime_yrs = 'Expected Lifetime is required.';
    } else if (!numberRegex.test(expected_lifetime_yrs)) {
      newErrors.expected_lifetime_yrs =
        'Expected Lifetime must contain only numbers.';
    }

    // Validate Launch Year
    if (!launch_year) {
      newErrors.launch_year = 'Launch Year is required.';
    } else if (!numberRegex.test(launch_year)) {
      newErrors.launch_year = 'Launch Year must contain only numbers.';
    }

    // Validate Orbit Type
    if (!orbit_type) {
      newErrors.orbit_type = 'Orbit Type is required.';
    }

    // Validate Country Contractor
    if (!contractor_country) {
      newErrors.contractor_country = 'Contractor Country is required.';
    }

    // Validate Launch Date
    if (!launch_date) {
      newErrors.launch_date = 'Launch Date is required.';
    }

    // Validate all required text fields
    const requiredFields = [
      { field: 'satellite_name', value: satellite_name, label: 'Name' },
      { field: 'nickname', value: nickname, label: 'Nickname' },
      { field: 'description', value: description, label: 'Description'},
      {
        field: 'country_org_un_registry',
        value: country_org_un_registry,
        label: 'Country/Org of UN Registry',
      },
      {
        field: 'country_operator_owner',
        value: country_operator_owner,
        label: 'Country of Operator/Owner',
      },
      { field: 'operator_owner', value: operator_owner, label: 'Operator/Owner' },
      { field: 'users', value: users, label: 'Users' },
      { field: 'purpose', value: purpose, label: 'Purpose' },
      { field: 'contractor', value: contractor, label: 'Contractor' },
      { field: 'launch_site', value: launch_site, label: 'Launch Site' },
      { field: 'launch_vehicle', value: launch_vehicle, label: 'Launch Vehicle' },
    ];

    requiredFields.forEach(({ field, value, label }) => {
      if (!value.trim()) {
        newErrors[field] = `${label} is required.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleUpdateSatellite = async () => {
    if (validateInputs()) {
      setIsLoading(true);
      
      const updatedSatelliteData = {
        satellite_id: parseInt(satellite_id),
        satellite_name,
        nickname,
        description,
        country_org_un_registry,
        country_operator_owner,
        operator_owner,
        users,
        purpose,
        orbit_type,
        launch_date: formatDateForAPI(launch_date),
        launch_year,
        expected_lifetime_yrs: parseInt(expected_lifetime_yrs),
        contractor,
        contractor_country,
        launch_site,
        launch_vehicle,
        active: satelliteData?.active || "1" // Preserve active status
      };

      try {
        const response = await fetch(API_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedSatelliteData),
        });

        const result = await response.json();
        setIsLoading(false);

        if (result.status === 'success') {
          setShowSuccessModal(true);
          successAnimationRef.current?.play();
          
          // Navigate back after animation completes
          setTimeout(() => {
            setShowSuccessModal(false);
            navigation.goBack();
          }, 2500);
        } else {
          setErrorMessage(result.message || 'Failed to update satellite.');
          setShowErrorModal(true);
          errorAnimationRef.current?.play();
          
          setTimeout(() => {
            setShowErrorModal(false);
          }, 2500);
        }
      } catch (error) {
        setIsLoading(false);
        setErrorMessage('Network error. Please check your connection.');
        setShowErrorModal(true);
        errorAnimationRef.current?.play();
        
        setTimeout(() => {
          setShowErrorModal(false);
        }, 2500);
      }
    } else {
      setErrorMessage('Please fill all required fields correctly.');
      setShowErrorModal(true);
      errorAnimationRef.current?.play();
      
      setTimeout(() => {
        setShowErrorModal(false);
      }, 2500);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setLaunchDate(selectedDate);
      setLaunchYear(selectedDate.getFullYear().toString());
    }
  };

  const renderInputField = (
    label,
    value,
    onChangeText,
    keyboardType = 'default',
    error,
    disabled = false,
    multiline = false,
    numberOfLines = 1
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.disabledInput,
          multiline && styles.textArea,
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#666"
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  // Special render method for description field with counter
  const renderDescriptionField = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        Description <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.descriptionContainer}>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors.description && styles.inputError,
          ]}
          value={description}
          onChangeText={setDescription}
          multiline={true}
          numberOfLines={6}
          placeholderTextColor="#666"
          placeholder="Enter detailed satellite description..."
          textAlignVertical="top"
        />
        <Text style={styles.charCounter}>
          {description.length} characters
        </Text>
      </View>
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LottieView
              ref={successAnimationRef}
              source={require('../assets/success_delete.json')}
              autoPlay
              loop={false}
              style={styles.animation}
            />
            <Text style={styles.animationSuccessText}>Satellite Updated Successfully!</Text>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <LottieView
              ref={errorAnimationRef}
              source={require('../assets/error.json')}
              autoPlay
              loop={false}
              style={styles.animation}
            />
            <Text style={styles.animationErrorText}>{errorMessage}</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Update Satellite</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderInputField(
            'Satellite ID',
            satellite_id,
            setSatelliteId,
            'numeric',
            errors.satellite_id,
            true // Disabled for update
          )}
          {renderInputField(
            'Name',
            satellite_name,
            setSatelliteName,
            'default',
            errors.satellite_name
          )}
          {renderInputField(
            'Nickname',
            nickname,
            setNickname,
            'default',
            errors.nickname
          )}
          {renderDescriptionField()}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ownership Details</Text>
          {renderInputField(
            'Country/Org of UN Registry',
            country_org_un_registry,
            setCountryOrgUnRegistry,
            'default',
            errors.country_org_un_registry
          )}
          {renderInputField(
            'Country of Operator/Owner',
            country_operator_owner,
            setCountryOperatorOwner,
            'default',
            errors.country_operator_owner
          )}
          {renderInputField(
            'Operator/Owner',
            operator_owner,
            setOperatorOwner,
            'default',
            errors.operator_owner
          )}
          {renderInputField('Users', users, setUsers, 'default', errors.users)}
          {renderInputField(
            'Purpose',
            purpose,
            setPurpose,
            'default',
            errors.purpose,
            false,
            true,
            3
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Technical Details</Text>
          {/* Changed from Picker to TextInput for orbit_type */}
          {renderInputField(
            'Orbit Type',
            orbit_type,
            setOrbitType,
            'default',
            errors.orbit_type,
            true
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Launch Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                errors.launch_date && styles.inputError,
              ]}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonText}>
                {launch_date ? launch_date.toDateString() : 'Select Launch Date'}
              </Text>
              <MaterialIcons name="calendar-today" size={24} color="#4CAF50" />
            </TouchableOpacity>
            {errors.launch_date && (
              <Text style={styles.errorText}>{errors.launch_date}</Text>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={launch_date || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}

          {renderInputField(
            'Launch Year',
            launch_year,
            setLaunchYear,
            'numeric',
            errors.launch_year,
            true // Disabled as it's set by the date picker
          )}
          {renderInputField(
            'Expected Lifetime (years)',
            expected_lifetime_yrs,
            setExpectedLifetime,
            'numeric',
            errors.expected_lifetime_yrs
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Launch Details</Text>
          {renderInputField(
            'Launch Site',
            launch_site,
            setLaunchSite,
            'default',
            errors.launch_site
          )}
          {renderInputField(
            'Launch Vehicle',
            launch_vehicle,
            setLaunchVehicle,
            'default',
            errors.launch_vehicle
          )}
          {renderInputField(
            'Contractor',
            contractor,
            setContractor,
            'default',
            errors.contractor
          )}
          {renderInputField(
            'Contractor Country',
            contractor_country,
            setContractorCountry,
            'default',
            errors.contractor_country
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleUpdateSatellite}
          disabled={isLoading}>
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Updating...' : 'Update Satellite'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  required: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  descriptionContainer: {
    position: 'relative',
  },
  charCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#888',
  },
  disabledInput: {
    backgroundColor: '#f9f9f9',
    color: '#888',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 24,
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  animation: {
    width: 150,
    height: 150,
  },
  animationSuccessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
    textAlign: 'center',
  },
  animationErrorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default UpdateSatellites;