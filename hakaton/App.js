import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Animated
} from 'react-native';

// Import components
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import ErrorDistribution from './components/ErrorDistribution';
import ProductErrorRates from './components/ProductErrorRates';
import ThresholdInput from './components/ThresholdInput';
import ProductList from './components/ProductList';
import LoadingIndicator from './components/LoadingIndicator';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [products, setProducts] = useState([]);
  const [errorThreshold, setErrorThreshold] = useState('2.0');
  const [filteredProducts, setFilteredProducts] = useState({
    errorFree: [],
    faulty: []
  });
  const [message, setMessage] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  // API URL based on environment
  const baseUrl = Platform.select({
    android: 'http://10.0.2.2:5000',
    ios: 'http://localhost:5000',
    // Uncomment and replace with your actual IP if using a physical device
    // default: 'http://192.168.1.x:5000',
  });

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/statistics`);
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const applyThreshold = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const threshold = parseFloat(errorThreshold);
      if (isNaN(threshold) || threshold < 0) {
        setMessage('Lütfen geçerli bir değer giriniz (0 veya daha büyük)');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/products?threshold=${threshold}`);
      const data = await response.json();
      
      if (data.message) {
        setMessage(data.message);
        setFilteredProducts({
          errorFree: [],
          faulty: data.faulty || []
        });
      } else {
        setFilteredProducts({
          errorFree: data.error_free || [],
          faulty: data.faulty || []
        });
      }
    } catch (error) {
      console.error('Error applying threshold:', error);
      setMessage('Bağlantı hatası. Lütfen sunucunun çalıştığından emin olun.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStatistics(), fetchProducts()]);
      await applyThreshold();
      setLoading(false);
      
      // Fade in the entire app
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    };
    
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Header />
          
          {loading && !statistics ? (
            <LoadingIndicator message="Veriler yükleniyor..." />
          ) : (
            <>
              <SummaryCards statistics={statistics} />
              <ErrorDistribution statistics={statistics} />
              <ProductErrorRates 
                products={products} 
                errorThreshold={errorThreshold} 
              />
              
              <ThresholdInput 
                value={errorThreshold} 
                onChangeText={setErrorThreshold}
                onApply={applyThreshold}
                loading={loading}
                message={message}
              />
              
              {loading ? (
                <LoadingIndicator message="Filtreleniyor..." />
              ) : (
                <View>
                  <ProductList 
                    title="Hatasız Ürünler" 
                    products={filteredProducts.errorFree} 
                    threshold={errorThreshold}
                    type="errorFree"
                  />
                  
                  <ProductList 
                    title="Hatalı Ürünler" 
                    products={filteredProducts.faulty} 
                    threshold={errorThreshold}
                    type="faulty"
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  }
});
