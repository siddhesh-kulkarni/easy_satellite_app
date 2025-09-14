import React, {useState, useEffect, useRef} from 'react';
import {View} from 'react-native';
import {WebView} from 'react-native-webview';

const SatelliteTracker = ({satelliteId, onPositionUpdate}) => {
  const [webViewKey, setWebViewKey] = useState(1);
  const webViewRef = useRef(null);

  useEffect(() => {
    setWebViewKey(prevKey => prevKey + 1);
  }, [satelliteId]);

  const getHtmlContent = () => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/satellite.js/4.0.0/satellite.min.js"></script>
    </head>
    <body>
      <script>
        // Function to send data back to React Native
        function postToReactNative(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
        
        // Function to fetch the TLE and start tracking
        async function initTracking() {
          const satelliteId = "${satelliteId}";
          
          try {
            const apiUrl = "https://celestrak.org/NORAD/elements/gp.php?CATNR="+satelliteId+"&FORMAT=TLE";
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
              throw new Error("API request failed");
            }
            
            const tleText = await response.text();
            const tleLines = tleText
              .split("\\n")
              .map(line => line.trim())
              .filter(line => line !== "");
            
            let tleLine1, tleLine2;
            
            if (tleLines.length === 3) {
              tleLine1 = tleLines[1];
              tleLine2 = tleLines[2];
            } else if (tleLines.length === 2) {
              tleLine1 = tleLines[0];
              tleLine2 = tleLines[1];
            } else {
              throw new Error("Invalid TLE data");
            }
            
            // Convert TLE lines to a satellite record
            const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
            
            // Function to update position
            function updatePosition() {
              try {
                const now = new Date();
                const posVel = satellite.propagate(satrec, now);
                
                if (!posVel.position) {
                  throw new Error("Position calculation failed");
                }
                
                const positionEci = posVel.position;
                const gmst = satellite.gstime(now);
                const positionGd = satellite.eciToGeodetic(positionEci, gmst);
                
                const latitude = satellite.degreesLat(positionGd.latitude);
                const longitude = satellite.degreesLong(positionGd.longitude);
                const altitude = positionGd.height;
                
                postToReactNative({
                  latitude: latitude.toFixed(6),
                  longitude: longitude.toFixed(6),
                  altitude: altitude.toFixed(2)
                });
              } catch (error) {
                console.error(error);
              }
            }
            
            // Update position every second
            updatePosition();
            setInterval(updatePosition, 1000);
            
          } catch (error) {
            console.error(error);
          }
        }
        
        // Start tracking when the page loads
        window.onload = initTracking;
      </script>
    </body>
    </html>
    `;
  };

  const onMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      onPositionUpdate({
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        altitude: parseFloat(data.altitude) || 0,
      });
    } catch (error) {
      console.error('Error parsing message from WebView:', error);
    }
  };

  return (
    <View style={{height: 1, opacity: 0.01}}>
      <WebView
        ref={webViewRef}
        key={webViewKey}
        source={{html: getHtmlContent()}}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={onMessage}
        style={{backgroundColor: 'transparent'}}
      />
    </View>
  );
};

export default SatelliteTracker;
