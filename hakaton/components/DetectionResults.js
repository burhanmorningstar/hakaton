import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, FlatList } from 'react-native';

const ResultItem = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 50),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  // Format timestamp to readable format
  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString();
    } catch (e) {
      return isoString || 'Tarih bilinmiyor';
    }
  };
  
  // Safely get values with defaults
  const defectType = item.defect_type || 'Bilinmeyen hata';
  const confidenceScore = item.confidence_score || 0;
  const locationX = item.location_x || 0;
  const locationY = item.location_y || 0;
  const width = item.width || 0;
  const height = item.height || 0;
  const timestamp = item.timestamp;

  return (
    <Animated.View 
      style={[
        styles.resultItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX }]
        }
      ]}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.defectType}>{defectType}</Text>
        <Text style={styles.confidence}>{(confidenceScore * 100).toFixed(1)}% Güven</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>Konum: ({locationX}, {locationY})</Text>
        <Text style={styles.detailText}>Boyut: {width}x{height} px</Text>
        <Text style={styles.timeText}>{formatDate(timestamp)}</Text>
      </View>
    </Animated.View>
  );
};

const DetectionResults = ({ results }) => {
  const containerAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  // Safely handle null or undefined results
  const safeResults = Array.isArray(results) ? results : [];
  
  if (safeResults.length === 0) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            opacity: containerAnim,
            transform: [{ translateY }]
          }
        ]}
      >
        <Text style={styles.title}>Son Tespitler</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Henüz tespit edilen hata bulunmamaktadır.</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <Text style={styles.title}>Son Tespitler</Text>
      <FlatList
        data={safeResults}
        renderItem={({ item, index }) => (
          <ResultItem item={item} index={index} />
        )}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#111827',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  resultItem: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  defectType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  confidence: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 3,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 5,
  }
});

export default DetectionResults; 