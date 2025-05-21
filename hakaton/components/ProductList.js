import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ProductItem = ({ item, threshold, index, isLastItem }) => {
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

  const isHighError = item.error_rate >= parseFloat(threshold);

  return (
    <Animated.View 
      style={[
        styles.productItem,
        !isLastItem && styles.productItemWithBorder,
        {
          opacity: fadeAnim,
          transform: [{ translateX }]
        }
      ]}
    >
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={[
        styles.errorRate, 
        isHighError ? styles.highError : styles.lowError
      ]}>
        {item.error_rate}%
      </Text>
      <View style={styles.productDetails}>
        <Text style={styles.detailText}>Üretim: {item.production_count}</Text>
        <Text style={styles.detailText}>Hata: {item.error_count}</Text>
      </View>
    </Animated.View>
  );
};

const ProductList = ({ title, products, threshold, type }) => {
  const containerAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    const delay = type === 'errorFree' ? 100 : 200;
    
    Animated.parallel([
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, [type]);
  
  const gradientColors = type === 'errorFree' 
    ? ['#10B98120', '#10B98105', 'transparent'] 
    : ['#EF444420', '#EF444405', 'transparent'];
  
  const headerBgColor = type === 'errorFree' ? '#ECFDF5' : '#FEF2F2';
  const headerBorderColor = type === 'errorFree' ? '#A7F3D0' : '#FECACA';
  const headerTextColor = type === 'errorFree' ? '#047857' : '#B91C1C';

  return (
    <Animated.View
      style={[
        styles.productListContainer,
        {
          opacity: containerAnim,
          transform: [{ translateY }]
        }
      ]}
    >
      <View style={[styles.productListHeader, { backgroundColor: headerBgColor, borderColor: headerBorderColor }]}>
        <Text style={[styles.productListTitle, { color: headerTextColor }]}>
          {title} ({products.length})
        </Text>
      </View>
      
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyListText}>
            {type === 'errorFree' ? 'Hatasız ürün bulunamadı' : 'Hatalı ürün bulunamadı'}
          </Text>
        </View>
      ) : (
        <View>
          <FlatList
            data={products}
            renderItem={({ item, index }) => (
              <ProductItem 
                item={item} 
                threshold={threshold}
                index={index}
                isLastItem={index === products.length - 1}
              />
            )}
            keyExtractor={item => item.id.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
          <LinearGradient
            colors={gradientColors}
            style={styles.gradientBottom}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  productListContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productListHeader: {
    padding: 15,
    borderBottomWidth: 1,
  },
  productListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  productItem: {
    padding: 15,
  },
  productItemWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  errorRate: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  lowError: {
    color: '#10B981',
  },
  highError: {
    color: '#EF4444',
  },
  productDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 15,
  },
  gradientBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 10,
  }
});

export default ProductList; 