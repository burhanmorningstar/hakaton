import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const SummaryCard = ({ value, label, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.summaryCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Animated.View>
  );
};

const SummaryCards = ({ statistics, product }) => {
  if (!statistics || !product) return null;
  
  // Safe values with default to prevent errors
  const productionCount = product.production_count || 0;
  const errorCount = product.error_count || 0;
  const errorRate = product.error_rate || 0;
  const defectTypes = statistics.defect_types || {};
  
  // Format values safely
  const formatNumber = (num) => {
    try {
      return (typeof num === 'number') ? num.toLocaleString() : '0';
    } catch (e) {
      return '0';
    }
  };
  
  const formatPercent = (num) => {
    try {
      return (typeof num === 'number') ? `${num.toFixed(2)}%` : '0.00%';
    } catch (e) {
      return '0.00%';
    }
  };
  
  const cards = [
    { 
      value: formatNumber(productionCount), 
      label: "Üretim Adeti" 
    },
    { 
      value: formatNumber(errorCount), 
      label: "Tespit Edilen Hata" 
    },
    { 
      value: formatPercent(errorRate), 
      label: "Hata Oranı" 
    },
    { 
      value: Object.keys(defectTypes).length, 
      label: "Hata Tipi Sayısı" 
    }
  ];

  return (
    <View style={styles.summaryContainer}>
      {cards.map((card, index) => (
        <SummaryCard 
          key={index}
          index={index}
          value={card.value}
          label={card.label}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  }
});

export default SummaryCards; 