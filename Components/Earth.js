import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {NavigationWrapper} from './Drawer';
import Profile from './Profile';
import SatellitesView from './SatellitesView';
import RateApp from './RateApp';
import LottieView from 'lottie-react-native';
import FAQ from './FAQ';
const Drawer = createDrawerNavigator();

// Earth Globe Screen Component with WebView
const EarthGlobeScreen = () => {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Earth</title>
  <style>
    body {
      margin: 0;
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
  
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    document.body.appendChild(renderer.domElement);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = Math.PI / 180;
    scene.add(earthGroup);
    
    // Modified OrbitControls with zoom limits
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 2.5;  // Minimum zoom limit (closer to Earth)
    controls.maxDistance = 27;   // Maximum zoom limit (farther from Earth)
    controls.zoomSpeed = 0.5;    // Reduced zoom speed for smoother control
    
    const detail = 12;
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.IcosahedronGeometry(1.2, detail);
    const material = new THREE.MeshPhongMaterial({
      map: loader.load("https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/00_earthmap1k.jpg"),
      specularMap: loader.load("https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/02_earthspec1k.jpg"),
      bumpMap: loader.load("https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/01_earthbump1k.jpg"),
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(geometry, material);
    earthGroup.add(earthMesh);
  
    const lightsMat = new THREE.MeshBasicMaterial({
      map: loader.load("https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/03_earthlights1k.jpg"),
      blending: THREE.AdditiveBlending,
    });
    const lightsMesh = new THREE.Mesh(geometry, lightsMat);
    earthGroup.add(lightsMesh);
  
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: loader.load(""),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      alphaMap: loader.load('https://raw.githubusercontent.com/UdayGajul/Earth/refs/heads/main/textures/05_earthcloudmaptrans.jpg'),
    });
    const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
    cloudsMesh.scale.setScalar(1.003);
    earthGroup.add(cloudsMesh);
  
    const fresnelMat = getFresnelMat();
    const glowMesh = new THREE.Mesh(geometry, fresnelMat);
    glowMesh.scale.setScalar(1.01);
    earthGroup.add(glowMesh);
  
    const stars = getStarfield({ numStars: 2000 });
    scene.add(stars);
  
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(-2, 0.5, 1.5);
    scene.add(sunLight);
  
    function animate() {
      requestAnimationFrame(animate);
  
      earthMesh.rotation.y += 0.002;
      lightsMesh.rotation.y += 0.002;
      cloudsMesh.rotation.y += 0.0023;
      glowMesh.rotation.y += 0.002;
      stars.rotation.y -= 0.0002;
      renderer.render(scene, camera);
    }
  
    animate();
  
    function handleWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', handleWindowResize, false);
  
    function getFresnelMat({ rimHex = 0x0088ff, facingHex = 0x000000 } = {}) {
      const uniforms = {
        color1: { value: new THREE.Color(rimHex) },
        color2: { value: new THREE.Color(facingHex) },
        fresnelBias: { value: 0.1 },
        fresnelScale: { value: 1.0 },
        fresnelPower: { value: 4.0 },
      };
      const vs = \`
        uniform float fresnelBias;
        uniform float fresnelScale;
        uniform float fresnelPower;
        
        varying float vReflectionFactor;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        
          vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
        
          vec3 I = worldPosition.xyz - cameraPosition;
        
          vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );
        
          gl_Position = projectionMatrix * mvPosition;
        }
      \`;
      const fs = \`
        uniform vec3 color1;
        uniform vec3 color2;
        
        varying float vReflectionFactor;
        
        void main() {
          float f = clamp( vReflectionFactor, 0.0, 1.0 );
          gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
        }
      \`;
      const fresnelMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,
        transparent: true,
        blending: THREE.AdditiveBlending,
      });
      return fresnelMat;
    }
  
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
      const positions = [];
      let col;
      for (let i = 0; i < numStars; i += 1) {
        let p = randomSpherePoint();
        const { pos, hue } = p;
        positions.push(p);
        col = new THREE.Color().setHSL(hue, 0.2, Math.random());
        verts.push(pos.x, pos.y, pos.z);
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
  </script>
</body>
</html>`;

  return <WebView source={{html: htmlContent}} style={styles.webview} />;
};

// Screen Wrapper component
const ScreenWrapper = ({children}) => {
  const navigation = useNavigation();

  const handleMenuPress = () => {
    navigation.openDrawer();
  };

  return (
    <View style={styles.screenContainer}>
      <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
        <Ionicons name="menu-outline" size={22} color="#fff" />
        <Text style={styles.menuText}>Menu</Text>
      </TouchableOpacity>
      {children}
    </View>
  );
};

// Main Earth component
const Earth = () => {
  const [isModalVisible, setModalVisible] = useState(false);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  return (
    <NavigationWrapper>
      {/* Here Drawer.Screen name="Earth" is changed to "EarthGlobe" 11/04/2025 before external */}
      <Drawer.Screen name="EarthGlobe">     
        {() => (
          <ScreenWrapper>
            <EarthGlobeScreen />
            <TouchableOpacity
              style={styles.lottieContainer}
              onPress={toggleModal}>
              <LottieView
                source={require('../assets/Animation _info_icon.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
            </TouchableOpacity>
            <Modal
              visible={isModalVisible}
              animationType="fade"
              transparent={true}
              onRequestClose={toggleModal}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.title}>Earth: Our Home Planet</Text>

                  <ScrollView style={styles.scrollView}>
                    <Text style={styles.sectionTitle}>
                      Position in the Solar System
                    </Text>
                    <Text style={styles.paragraph}>
                      Earth is the third planet from the Sun, positioned between
                      Venus and Mars.
                    </Text>

                    <Text style={styles.sectionTitle}>Atmosphere</Text>
                    <Text style={styles.paragraph}>
                      Earth's atmosphere is composed mainly of nitrogen and
                      oxygen, supporting a wide range of life forms.
                    </Text>

                    <Text style={styles.sectionTitle}>Diverse Ecosystems</Text>
                    <Text style={styles.paragraph}>
                      The planet features diverse ecosystems, including forests,
                      deserts, oceans, and mountains, each hosting unique
                      species.
                    </Text>

                    <Text style={styles.sectionTitle}>Support for Life</Text>
                    <Text style={styles.paragraph}>
                      Earth's unique position and climate conditions make it the
                      only known planet to support life.
                    </Text>

                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() =>
                        Linking.openURL('https://en.wikipedia.org/wiki/Earth')
                      }>
                      <Text style={styles.linkText}>
                        Learn more about Earth
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.callToAction}>
                      Want to know more about Earth?
                    </Text>
                    <Text style={styles.callToAction}>
                      Then watch Planet Earth on YouTube by Netflix 👇
                    </Text>
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() =>
                        Linking.openURL(
                          'https://youtube.com/playlist?list=PLydZ2Hrp_gPS1DRwFcowNTRNR1B9QbPm3&feature=shared',
                        )
                      }>
                      <Text style={styles.linkText}>Planet Earth</Text>
                    </TouchableOpacity>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={toggleModal}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScreenWrapper>
        )}
      </Drawer.Screen>
      <Drawer.Screen name="Profile" component={Profile} />
      <Drawer.Screen name="RateApp" component={RateApp} />
      <Drawer.Screen name="Satellite FAQs" component={FAQ} />
      <Drawer.Screen name="Satellites">
        {props => (
          <ScreenWrapper>
            <SatellitesView orbitType={props.route.params?.orbitType} />
          </ScreenWrapper>
        )}
      </Drawer.Screen>
    </NavigationWrapper>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  menuButton: {
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
  menuText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  lottieContainer: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{translateX: -25}],
    zIndex: 100,
  },
  lottie: {
    width: 50,
    height: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    height: 500,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  callToAction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  linkButton: {
    marginTop: 5,
  },
  linkText: {
    color: 'blue',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#f44336',
    padding: 5,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
  },
  scrollView: {
    width: '100%',
  },
});

export default Earth;
