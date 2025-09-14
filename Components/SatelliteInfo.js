import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BASE_URL from '../api/Api';

const SatelliteInfo = ({ route }) => {
  const { satelliteId, satelliteName } = route.params;
  const [satelliteData, setSatelliteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchSatelliteData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/satellite.php?satellite_id=${satelliteId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "success" && data.data && data.data.length > 0) {
            setSatelliteData(data.data[0]);
          } else {
            throw new Error(data.message || 'Failed to fetch satellite data');
          }
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (error) {
        setError(`${error.message}`);
        console.log("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSatelliteData();
  }, [satelliteId]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const toggleExpand = (label) => {
    setExpandedItem(expandedItem === label ? null : label);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading satellite data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Make sure we have data before attempting to create the display items
  if (!satelliteData) {
    return (
      <SafeAreaView style={styles.screenContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No data available for this satellite</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Create data array from all satelliteData fields
  const data = [
    { label: 'Satellite ID', value: satelliteData.satellite_id || 'N/A' },
    { label: 'Satellite Name', value: satelliteData.satellite_name || 'N/A' },
    { label: 'Nickname', value: satelliteData.nickname || 'N/A' },
    { label: 'Description', value: satelliteData.description || 'N/A', longText: true },
    { label: 'Country of Registry', value: satelliteData.country_org_un_registry || 'N/A' },
    { label: 'Country Operator/Owner', value: satelliteData.country_operator_owner || 'N/A' },
    { label: 'Operator/Owner', value: satelliteData.operator_owner || 'N/A' },
    { label: 'Users', value: satelliteData.users || 'N/A', longText: true },
    { label: 'Purpose', value: satelliteData.purpose || 'N/A', longText: true },
    { label: 'Orbit Type', value: satelliteData.orbit_type || 'N/A' },
    { label: 'Launch Date', value: satelliteData.launch_date || 'N/A' },
    { label: 'Launch Year', value: satelliteData.launch_year || 'N/A' },
    { label: 'Expected Lifetime (Years)', value: satelliteData.expected_lifetime_yrs || 'N/A' },
    { label: 'Contractor', value: satelliteData.contractor || 'N/A' },
    { label: 'Contractor Country', value: satelliteData.contractor_country || 'N/A' },
    { label: 'Launch Site', value: satelliteData.launch_site || 'N/A' },
    { label: 'Launch Vehicle', value: satelliteData.launch_vehicle || 'N/A' },
    { label: 'Status', value: satelliteData.active === 1 || satelliteData.active === "1" ? "Active" : "Inactive" },
  ];

  const renderItem = ({ item }) => {
    const isExpanded = expandedItem === item.label;
    const isLongText = item.longText && item.value && item.value.length > 50;
    
    return (
      <TouchableOpacity 
        style={styles.dataRow}
        onPress={() => isLongText ? toggleExpand(item.label) : null}
        activeOpacity={isLongText ? 0.7 : 1}
      >
        <View style={styles.labelContainer}>
          <Text style={styles.dataLabel}>{item.label}</Text>
          {isLongText && (
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#8888ff" 
            />
          )}
        </View>
        <Text 
          style={[
            styles.dataValue, 
            isLongText && !isExpanded && styles.truncatedText
          ]}
          numberOfLines={isLongText && !isExpanded ? 2 : null}
        >
          {item.value}
        </Text>
        {isLongText && !isExpanded && (
          <Text style={styles.seeMoreText}>Tap to {isExpanded ? 'collapse' : 'expand'}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{satelliteData.satellite_name || satelliteName}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.label}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    height: 60,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingLeft: 10,
  },
  backButton: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // backgroundColor: 'transparent',
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  backText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContent: {
    backgroundColor: '#2a2a5a',
    borderRadius: 15,
    padding: 15,
  },
  dataRow: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 16,
    color: '#8888ff',
    fontWeight: '500',
    marginBottom: 5,
  },
  dataValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  truncatedText: {
    lineHeight: 26,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#8888ff',
    marginTop: 5,
    fontStyle: 'italic',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    fontSize: 18,
    color: '#ff6666',
    marginTop: 10,
    textAlign: 'center',
    padding: 20,
  },
});

export default SatelliteInfo;