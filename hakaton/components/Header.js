import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';

const Header = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.headerContainer,
        { 
          opacity: fadeAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={styles.header}>Üretim Hata İstatistikleri</Text>
      <View style={styles.underline} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  underline: {
    height: 3,
    width: 40,
    backgroundColor: '#6366F1',
    marginTop: 8,
    borderRadius: 2,
  }
});

export default Header; 