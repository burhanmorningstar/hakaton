import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const CategoryBar = ({ category, total, index }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.timing(widthAnim, {
          toValue: (category.count / total) * 100,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ]).start();
  }, [category, total]);

  return (
    <Animated.View style={[styles.categoryContainer, { opacity: fadeAnim }]}>
      <View style={styles.labelContainer}>
        <View style={[styles.colorIndicator, { backgroundColor: category.color }]} />
        <Text style={styles.categoryLabel}>{category.label}</Text>
        <Text style={styles.categoryCount}>({category.count})</Text>
      </View>
      <View style={styles.barContainer}>
        <Animated.View 
          style={[
            styles.bar, 
            { 
              backgroundColor: category.color,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }),
            }
          ]} 
        />
      </View>
    </Animated.View>
  );
};

const ErrorDistribution = ({ statistics }) => {
  if (!statistics) return null;
  
  const categories = [
    { label: "0%", count: statistics.error_ranges["0"], color: "#00C49F" },
    { label: "0-1%", count: statistics.error_ranges["0-1"], color: "#90EE90" },
    { label: "1-2%", count: statistics.error_ranges["1-2"], color: "#FFBB28" },
    { label: "2-3%", count: statistics.error_ranges["2-3"], color: "#FF8042" },
    { label: "3%+", count: statistics.error_ranges["3+"], color: "#FF6347" }
  ];
  
  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  const containerAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 600,
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
        styles.chartContainer,
        {
          opacity: containerAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={styles.chartTitle}>Hata Oranı Dağılımı</Text>
      <View style={styles.distributionBars}>
        {categories.map((category, index) => (
          <CategoryBar 
            key={index}
            category={category}
            total={total}
            index={index}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#111827',
  },
  distributionBars: {
    marginTop: 10,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 5,
  },
  barContainer: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 5,
  }
});

export default ErrorDistribution; 