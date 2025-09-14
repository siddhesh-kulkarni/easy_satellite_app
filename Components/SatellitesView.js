import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import SatelliteTracker from './Coordinates'; // Import the background component
import BASE_URL from '../api/Api';

const SatellitesView = () => {
  const [expandedCountry, setExpandedCountry] = useState(null);
  const [satelliteData, setSatelliteData] = useState({
    LEO: {},
    MEO: {},
    GEO: {},
  });
  const [selectedSatellite, setSelectedSatellite] = useState(null);
  const [satellitePosition, setSatellitePosition] = useState({
    latitude: 0,
    longitude: 0,
    altitude: 0
  });
  
  const route = useRoute();
  const navigation = useNavigation();

  async function fetchSatelliteData() {
    try {
      const response = await fetch(`${BASE_URL}/satellite.php`);
      const data = await response.json();

      if (data && Array.isArray(data.data)) {
        // Filter only active satellites where active status is '1'
        const satellites = data.data.filter(satellite => 
          satellite.active === '1'
        );
        
        console.log('Active Satellites:', satellites);

        const satelliteMap = {
          LEO: {},
          MEO: {},
          GEO: {},
        };

        satellites.forEach((satellite) => {
          const orbitType = satellite.orbit_type;
          const country = satellite.country_operator_owner;
          
          if (!satelliteMap[orbitType][country]) {
            satelliteMap[orbitType][country] = [];
          }

          // Push the full satellite object with the satellite_id property.
          satelliteMap[orbitType][country].push({
            name: satellite.satellite_name,
            satellite_id: satellite.satellite_id,
            // You can include any other properties you need here.
          });
        });

        setSatelliteData(satelliteMap);
      } else {
        console.error('Expected data to be an array under the "data" key.');
      }
    } catch (error) {
      console.error('Error fetching satellite data:', error);
    }
  }

  useEffect(() => {
    fetchSatelliteData();
  }, []);

  // Get orbit type from route params, default to LEO
  const orbitType = route.params?.orbitType || 'LEO';

  const handleCountryPress = (country) => {
    setExpandedCountry(expandedCountry === country ? null : country);
  };

  const getOrbitTitle = (orbit) => {
    const orbitTitles = {
      LEO: 'Low Earth Orbit (LEO)',
      MEO: 'Medium Earth Orbit (MEO)',
      GEO: 'Geostationary Orbit (GEO)',
    };
    return orbitTitles[orbit];
  };

  const handleSatellitePress = (satellite) => {
    setSelectedSatellite(satellite);
    
    // Wait for position to be updated before navigating
    setTimeout(() => {
      navigation.navigate('EarthWithSatellite', { 
        satellite: satellite,
        orbitType: orbitType,
        satelliteId: satellite.satellite_id,
        position: satellitePosition
      });
      console.log(
        'Navigating to satellite:', 
        satellite, 
        'Orbit type:', orbitType, 
        'Satellite ID:', satellite.satellite_id,
        'Position:', satellitePosition
      );
    }, 500); // Short delay to ensure position data is received
  };

  // Handle satellite position updates
  const handlePositionUpdate = (position) => {
    setSatellitePosition(position);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background satellite tracker component */}
      {selectedSatellite && (
        <SatelliteTracker
          satelliteId={selectedSatellite.satellite_id}
          onPositionUpdate={handlePositionUpdate}
        />
      )}
      
      <View>
        <Text style={styles.heading}>Active Satellites by Countries</Text>
        <Text style={styles.subHeading}>{getOrbitTitle(orbitType)}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.countriesContainer}>
          {Object.keys(satelliteData[orbitType]).map((country) => (
            <View key={country} style={styles.countrySection}>
              <TouchableOpacity
                style={styles.countryHeader}
                onPress={() => handleCountryPress(country)}>
                <Text style={styles.countryText}>{country}</Text>
                <Text style={styles.expandIcon}>
                  {expandedCountry === country ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>

              {expandedCountry === country && (
                <View style={styles.satellitesList}>
                  {satelliteData[orbitType][country].map((satellite) => (
                    <TouchableOpacity
                      key={satellite.satellite_id}
                      onPress={() => handleSatellitePress(satellite)}>
                      <Text style={styles.satelliteItem}>• {satellite.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 10,
    color: '#2c3e50',
  },
  subHeading: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#34495e',
  },
  countriesContainer: {
    paddingHorizontal: 16,
  },
  countrySection: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  countryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e9ecef',
  },
  countryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  expandIcon: {
    fontSize: 14,
    color: '#2c3e50',
  },
  satellitesList: {
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  satelliteItem: {
    fontSize: 14,
    marginBottom: 8,
    color: '#495057',
    paddingLeft: 10,
  },
});

export default SatellitesView;