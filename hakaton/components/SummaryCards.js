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

const SummaryCards = ({ statistics }) => {
  if (!statistics) return null;
  
  const cards = [
    { 
      value: statistics.total_products, 
      label: "Toplam Ürün" 
    },
    { 
      value: statistics.total_production.toLocaleString(), 
      label: "Üretim Adeti" 
    },
    { 
      value: statistics.total_errors.toLocaleString(), 
      label: "Toplam Hata" 
    },
    { 
      value: `${statistics.avg_error_rate.toFixed(2)}%`, 
      label: "Ort. Hata" 
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