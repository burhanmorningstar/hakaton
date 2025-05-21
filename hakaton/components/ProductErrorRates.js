import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ErrorBar = ({ product, maxErrorRate, threshold, index }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 120),
      Animated.parallel([
        Animated.timing(widthAnim, {
          toValue: (product.error_rate / maxErrorRate) * 100,
          duration: 800,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, [product, maxErrorRate]);

  const isHighError = product.error_rate >= parseFloat(threshold);

  return (
    <Animated.View style={[styles.errorRateItem, { opacity: opacityAnim }]}>
      <Text style={styles.errorRateLabel} numberOfLines={1} ellipsizeMode="tail">
        {product.name}
      </Text>
      <View style={styles.errorBarContainer}>
        <Animated.View 
          style={[
            styles.errorBar, 
            { 
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }),
              backgroundColor: isHighError ? '#EF4444' : '#10B981'
            }
          ]} 
        />
        <Text style={styles.errorRateValue}>{product.error_rate}%</Text>
      </View>
    </Animated.View>
  );
};

const ProductErrorRates = ({ products, errorThreshold }) => {
  if (!products || products.length === 0) return null;
  
  // Get top 6 products
  const topProducts = [...products]
    .sort((a, b) => b.error_rate - a.error_rate)
    .slice(0, 6);
  
  const maxErrorRate = Math.max(...topProducts.map(p => p.error_rate));
  
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
      <Text style={styles.chartTitle}>En Yüksek Hata Oranları</Text>
      <View style={styles.errorRateChart}>
        {topProducts.map((product, index) => (
          <ErrorBar 
            key={index} 
            product={product} 
            maxErrorRate={maxErrorRate}
            threshold={errorThreshold}
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
  errorRateChart: {
    marginTop: 10,
  },
  errorRateItem: {
    marginBottom: 12,
  },
  errorRateLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
    width: '60%',
  },
  errorBarContainer: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBar: {
    height: '100%',
    borderRadius: 8,
  },
  errorRateValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4B5563',
    position: 'absolute',
    right: 6,
  }
});

export default ProductErrorRates; 