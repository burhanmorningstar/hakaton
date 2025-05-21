import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const LoadingIndicator = ({ message = 'Yükleniyor...' }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // For circle animations
  const circle1 = useRef(new Animated.Value(0)).current;
  const circle2 = useRef(new Animated.Value(0)).current;
  const circle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the text
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for spinner
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    // Circle animations
    Animated.loop(
      Animated.stagger(200, [
        Animated.timing(circle1, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(circle2, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(circle3, {
          toValue: 1, 
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(circle1, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circle2, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(circle3, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.loading}>
        <Animated.View style={[
          styles.spinner, 
          { transform: [{ rotate: spin }] }
        ]}>
          <View style={styles.spinnerInner} />
        </Animated.View>
        
        <View style={styles.dotsContainer}>
          <Animated.View style={[
            styles.dot, 
            { opacity: circle1, transform: [{ scale: circle1 }] }
          ]} />
          <Animated.View style={[
            styles.dot, 
            { opacity: circle2, transform: [{ scale: circle2 }] }
          ]} />
          <Animated.View style={[
            styles.dot, 
            { opacity: circle3, transform: [{ scale: circle3 }] }
          ]} />
        </View>
        
        <Animated.Text style={[
          styles.loadingText,
          { opacity: pulseAnim }
        ]}>
          {message}
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    alignItems: 'center',
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6366F1', 
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    margin: 3,
  },
  loadingText: {
    color: '#6366F1',
    fontWeight: '500',
    marginTop: 8,
  },
});

export default LoadingIndicator; 