import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; // Import Lottie
import SatelliteTracker from './Coordinates'; // Import the background component

const ScreenWrapper = ({ children }) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack(); // This will go back to the previous screen
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>{children}</View>
    </SafeAreaView>
  );
};

const EarthWithSatellite = () => {
  const webViewRef = useRef(null);
  const route = useRoute(); // Get route parameters
  const { satellite, orbitType, satelliteId } = route.params || {}; // Retrieve parameters safely
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  // State to store satellite position
  const [position, setPosition] = useState({
    latitude: 0,
    longitude: 0,
    altitude: 0,
  });

  // Update WebView when position changes
  useEffect(() => {
    if (webViewRef.current && position.latitude && position.longitude) {
      const updateScript = `
        try {
          // Update the marker's position
          const lat = ${position.latitude};
          const lng = ${position.longitude};
          const altitude = ${position.altitude};
          
          // Calculate radius based on altitude
          // Earth radius is 6371 km, and our model Earth radius is 1.0 units
          // So we scale the altitude accordingly to maintain proportion
          // Adding a small multiplier to make altitude differences more visible
          const altitudeScale = 0.5; // Adjust this value to make altitude changes more visible
          const scaledAltitude = (altitude / 6371) * altitudeScale;
          const radius = 1.0 + scaledAltitude;
          
          // Remove old marker and line completely
          if (window.locationMarker) {
            window.earthGroup.remove(window.locationMarker);
            window.locationMarker = null;
          }
          
          if (window.locationLine && window.locationLine.length > 0) {
            window.locationLine.forEach(line => window.earthGroup.remove(line));
            window.locationLine = [];
          }
          
          // Add new marker with a consistent small size (independent of altitude)
          window.locationMarker = window.addMarkerAtLatLon(lat, lng, radius, window.earthGroup, 0xff0000, 0.015);
          console.log("Updated marker position:", lat, lng, "altitude:", altitude, "radius:", radius);
        } catch (error) {
          console.error("Error updating marker:", error);
        }
      `;
      webViewRef.current.injectJavaScript(updateScript);
    }
  }, [position]);

  const handlePositionUpdate = (newPosition) => {
    setPosition(newPosition);
  };

  const toggleModal = () => {
    setModalVisible(!modalVisible);
  };

  // Handle navigation to satellite detail screen
 const handleMoreInfo = () => {
  // Close the modal first
  setModalVisible(false);
  console.log('SatelliteId',satelliteId);
  // Navigate to satellite details screen with the satellite ID and name
  navigation.navigate('SatelliteInfo', {
    satelliteId: satelliteId,    // Pass selected satellite ID
    satelliteName: satellite,     // Pass selected satellite name
  });
};


  const htmlContent = `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Earth with Location Marker</title>
  <style>
      body {
          margin: 0;
          overflow: hidden;
      }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.161/build/three.module.js",
        "jsm/": "https://cdn.jsdelivr.net/npm/three@0.161/examples/jsm/"
      }
    }
  </script>
</head>

<body>
  <script type="module">
    import * as THREE from "three";
    import { OrbitControls } from 'jsm/controls/OrbitControls.js';

    window.earthGroup = null;
    window.locationMarker = null;
    window.locationLine = [];
    window.addMarkerAtLatLon = null;

    function latLngToVector3(lat, lng, radius) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = (radius * Math.cos(phi));
      const z = (radius * Math.sin(phi) * Math.sin(theta));
      return new THREE.Vector3(x, y, z);
    }

    function addMarkerAtLatLon(latitude, longitude, radius, scene, color = 0xff0000, size = 0.03) {
      const position = latLngToVector3(latitude, longitude, radius);
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      scene.add(mesh);

      // Create line from center to satellite position for better visibility
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        position
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff4444, 
        transparent: true,
        opacity: 0.5,
        linewidth: 1
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      window.locationLine.push(line);
      scene.add(line);

      return mesh;
    }

    window.addMarkerAtLatLon = addMarkerAtLatLon;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 3;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    document.body.appendChild(renderer.domElement);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    window.earthGroup = earthGroup;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 1.8;
    controls.maxDistance = 10;
    controls.zoomSpeed = 0.5;

    const earthRadius = 1;
    const loader = new THREE.TextureLoader();
    const earthTexture = loader.load("https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/00_earthmap1k.jpg");
    const geometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      map: earthTexture,
    });
    const earthMesh = new THREE.Mesh(geometry, material);
    earthGroup.add(earthMesh);

    const stars = getStarfield({ numStars: 2000 });
    scene.add(stars);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(-2, 0.5, 1.5);
    scene.add(sunLight);

    function animate() {
      requestAnimationFrame(animate);
      stars.rotation.y -= 0.00099;
      renderer.render(scene, camera);
    }

    function handleWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleWindowResize, false);

    function getStarfield({ numStars = 500 } = {}) {
      function randomSpherePoint() {
        const radius = Math.random() * 25 + 25;
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        let x = radius * Math.sin(phi) * Math.cos(theta);
        let y = radius * Math.sin(phi) * Math.sin(theta);
        let z = radius * Math.cos(phi);
        return {
          pos: new THREE.Vector3(x, y, z),
          hue: 0.6,
          minDist: radius,
        };
      }
      const verts = [];
      const colors = [];
      for (let i = 0; i < numStars; i += 1) {
        const { pos, hue } = randomSpherePoint();
        verts.push(pos.x, pos.y, pos.z);
        const col = new THREE.Color().setHSL(hue, 0.2, Math.random());
        colors.push(col.r, col.g, col.b);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        map: new THREE.TextureLoader().load(
          "https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/stars/circle.png"
        ),
      });
      const points = new THREE.Points(geo, mat);
      return points;
    }

    animate();
  </script>
</body>
</html>
  `;

  return (
    <ScreenWrapper>
      {/* Satellite tracker as a background component */}
      <SatelliteTracker
        satelliteId={satelliteId}
        onPositionUpdate={handlePositionUpdate}
      />

      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
      />

      {/* Info Button with Lottie Animation */}
      <View style={styles.infoButtonContainer}>
        <TouchableOpacity onPress={toggleModal} style={styles.infoButton}>
          <LottieView
            source={require('../assets/Animation _info_icon.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </TouchableOpacity>
      </View>

      {/* Modal for displaying satellite information */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Satellite Position</Text>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Latitude:</Text>
              <Text style={styles.dataValue}>
                {position.latitude.toFixed(4)}°
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Longitude:</Text>
              <Text style={styles.dataValue}>
                {position.longitude.toFixed(4)}°
              </Text>
            </View>

            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Altitude:</Text>
              <Text style={styles.dataValue}>
                {position.altitude.toFixed(2)} km
              </Text>
            </View>

            {/* More Info Link - NEW ADDITION */}
            <TouchableOpacity
              onPress={handleMoreInfo}
              style={styles.moreInfoLink}>
              <Text style={styles.moreInfoText}>More Information</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'black', // Matching background color with WebView
  },
  header: {
    height: 60,
    justifyContent: 'flex-end',
    paddingBottom: 10,
    paddingLeft: 10,
  },
  contentContainer: {
    flex: 1,
  },
  backButton: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // backgroundColor: 'transparent', // Transparent background
    position: 'absolute',
    top: 20,
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
  webview: {
    flex: 1,
  },
  infoButtonContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  infoButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 50,
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dataLabel: {
    fontSize: 16,
    color: '#8888ff',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // New styles for the More Info link
  moreInfoLink: {
    marginTop: 15,
    paddingVertical: 8,
  },
  moreInfoText: {
    color: '#4da6ff',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: '#3a3a8a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EarthWithSatellite;
