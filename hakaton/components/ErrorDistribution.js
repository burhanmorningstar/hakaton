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
          toValue: total > 0 ? (category.count / total) * 100 : 0,
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
  
  // Safely get defect_types with default empty object
  const defectTypes = statistics.defect_types || {};
  
  // Convert defect_types object to array for rendering
  const defectTypesArray = Object.entries(defectTypes).map(([key, value]) => ({
    label: key,
    count: value
  }));
  
  // Sort by count (descending)
  defectTypesArray.sort((a, b) => b.count - a.count);
  
  // Take top 5
  const topDefects = defectTypesArray.slice(0, 5);
  
  // Define colors for the bars
  const colors = ['#00C49F', '#FFBB28', '#FF8042', '#0088FE', '#FF6347'];
  
  // Add colors to the categories
  const categories = topDefects.map((item, index) => ({
    ...item,
    color: colors[index % colors.length]
  }));
  
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

  if (categories.length === 0) {
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
        <Text style={styles.chartTitle}>Hata Tipi Dağılımı</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz hata tipi bilgisi bulunmamaktadır.</Text>
        </View>
      </Animated.View>
    );
  }

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
      <Text style={styles.chartTitle}>Hata Tipi Dağılımı</Text>
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
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
  }
});

export default ErrorDistribution; 