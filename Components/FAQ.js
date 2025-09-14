import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ScreenWrapper = ({ children }) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.contentContainer}>{children}</View>
    </SafeAreaView>
  );
};

const FAQ = () => {
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // FAQ data structure with all questions in a single list
  const faqData = [
    {
      question: 'What is a satellite?',
      answer:
        'A satellite is an object that orbits a planet or star. In the context of Earth, satellites can be natural, like the Moon, or artificial, meaning human-made objects launched into space to serve various purposes, such as communication, navigation, and observation.',
    },
    {
      question: 'What are the different types of satellites?',
      answer:
        "• Communication Satellites: Facilitate global communication by relaying signals for television, internet, and phone services.\n• Weather Satellites: Monitor Earth's weather patterns and climate changes by capturing atmospheric data.\n• Navigation Satellites: Provide GPS services, enabling precise location tracking for navigation systems.\n• Earth Observation Satellites: Collect data on Earth's surface, aiding in environmental monitoring and resource management.\n• Scientific Satellites: Conduct experiments and gather data for research in space and astrophysics.",
    },
    {
      question: 'Why are satellites important?',
      answer:
        'Satellites play a crucial role in various aspects of modern life, including global communication, weather forecasting, navigation, environmental monitoring, and scientific research. They enable services that billions of people rely on daily.',
    },
    {
      question: 'How do satellites stay in orbit?',
      answer:
        "Satellites remain in orbit due to a balance between their forward velocity and Earth's gravitational pull. This balance ensures they continuously fall towards Earth without ever reaching the surface, effectively staying in a stable orbit.",
    },
    {
      question: 'What are the main types of satellite orbits?',
      answer:
        "• Low Earth Orbit (LEO): Located a few hundred kilometers above Earth, typically around 300 km (186 miles). Satellites in LEO have shorter orbital periods and are commonly used for communication and Earth observation.\n• Medium Earth Orbit (MEO): Situated between LEO and Geostationary Orbit, MEO is often used for navigation satellites, such as those in the GPS constellation.\n• Geostationary Orbit (GEO): Approximately 35,786 km (22,236 miles) above Earth's equator, satellites in GEO appear stationary relative to the Earth's surface, making this orbit ideal for communication and weather satellites.",
    },
    {
      question: 'How do satellites communicate with Earth?',
      answer:
        'Satellites communicate with Earth using radio-frequency (RF) signals. Ground stations transmit signals to the satellite (known as the uplink), typically using high-power radio transmitters. The satellite receives these signals, processes or amplifies them, and then retransmits them back to Earth (through the downlink). The downlinked signals are received by ground stations or other satellite terminals on Earth. This two-way communication allows satellites to exchange data for a variety of applications, including telecommunications, weather monitoring, navigation, and Earth observation.',
    },
    {
      question: 'What is space debris, and why is it a concern?',
      answer:
        'Space debris, or "space junk," refers to defunct satellites, spent rocket stages, and other fragments resulting from collisions or disintegration of satellites. This debris poses a significant hazard to operational satellites and spacecraft due to the risk of collisions and the creation of additional debris.',
    },
    {
      question: 'What are the challenges of operating satellites in space?',
      answer:
        '• Orientation and Positioning: Satellites use onboard systems like reaction wheels and control moment gyroscopes to maintain proper orientation and adjust their positions as needed.\n• Space Debris: Satellites are designed with shielding to mitigate impacts from small debris and are equipped with propulsion systems to maneuver away from larger debris when necessary.',
    },
    {
      question: 'How are satellites powered in space?',
      answer:
        'Satellites primarily rely on solar panels to convert sunlight into electrical energy, powering their systems. During periods without sunlight, satellites use rechargeable batteries to store energy, ensuring continuous operation.',
    },
    {
      question: 'Can satellites be repaired or serviced after launch?',
      answer:
        'While most satellites are designed for limited lifespans and are not intended for in-space repairs, there have been missions aimed at servicing satellites, such as the Hubble Space Telescope servicing missions. If a satellite malfunctions, operators attempt to troubleshoot and resolve issues remotely; however, physical repairs are generally not feasible.',
    },
    {
      question: 'What is a Two-Line Element set (TLE)?',
      answer:
        "A Two-Line Element set (TLE) is a data format used to represent the orbital elements of Earth-orbiting objects, such as satellites and space debris, at a specific point in time known as the epoch. Each TLE consists of two lines of alphanumeric characters, encoding details like the satellite's identification number, classification, launch details, and orbital parameters (e.g., inclination, eccentricity, and mean motion). TLEs are essential for predicting satellite positions and are widely used in satellite tracking applications.",
    },
    {
      question:'Example of TLE?',
      answer:"ISS (ZARYA)\n\n1 25544U 98067A   20300.83097691  .00001534  00000-0  35580-4 0  9996\n2 25544  51.6453  57.0843 0001671  64.9808  73.0513 15.49338189252428"
    }
  ];

  const handleQuestionPress = (question) => {
    setExpandedQuestion(expandedQuestion === question ? null : question);
  };

  return (
    <ScreenWrapper>
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Satellite FAQ</Text>
        <Text style={styles.subHeading}>Frequently Asked Questions</Text>
        <ScrollView>
          <View style={styles.questionsContainer}>
            {faqData.map((item) => (
              <View key={item.question} style={styles.questionSection}>
                <TouchableOpacity
                  style={styles.questionHeader}
                  onPress={() => handleQuestionPress(item.question)}>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <Text style={styles.expandIcon}>
                    {expandedQuestion === item.question ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {expandedQuestion === item.question && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: 'flex-end',
    paddingBottom: 10,
  },
  contentContainer: {
    flex: 1,
  },
  backButton: {
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  subHeading: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#34495e',
  },
  questionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  questionSection: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e9ecef',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: '#2c3e50',
    paddingLeft: 8,
  },
  answerContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057',
  },
});

export default FAQ;