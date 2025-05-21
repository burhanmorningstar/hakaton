import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Easing 
} from 'react-native';

const ThresholdInput = ({ 
  value, 
  onChangeText, 
  onApply, 
  loading,
  message
}) => {
  const containerAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const [buttonPressed, setButtonPressed] = useState(false);
  
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setButtonPressed(true);
    Animated.timing(buttonScaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setButtonPressed(false);
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.thresholdContainer,
        {
          opacity: containerAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={styles.thresholdLabel}>Hata Eşik Değeri (%)</Text>
      <View style={styles.thresholdInputContainer}>
        <TextInput
          style={styles.thresholdInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder="Eşik değeri (örn: 2.0)"
        />
        <TouchableOpacity 
          style={styles.applyButtonContainer}
          onPress={onApply}
          disabled={loading}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View 
            style={[
              styles.applyButton,
              {
                transform: [{ scale: buttonScaleAnim }]
              },
              buttonPressed && styles.applyButtonPressed
            ]}
          >
            <Text style={styles.applyButtonText}>Uygula</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {message ? (
        <Animated.View 
          style={[
            styles.messageContainer,
            { opacity: containerAnim }
          ]}
        >
          <Text style={styles.messageText}>{message}</Text>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  thresholdContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thresholdLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  thresholdInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#F9FAFB',
  },
  applyButtonContainer: {
    // Transparent wrapper for the touch area
  },
  applyButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  applyButtonPressed: {
    backgroundColor: '#4F46E5',
    shadowOpacity: 0.2,
    elevation: 2,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  messageText: {
    color: '#B91C1C',
    fontSize: 14,
  }
});

export default ThresholdInput; 