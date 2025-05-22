import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  View,
  Animated,
  Text,
  Alert,
  TouchableOpacity,
  RefreshControl
} from 'react-native';

// Import components
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import ErrorDistribution from './components/ErrorDistribution';
import ProductErrorRates from './components/ProductErrorRates';
import ThresholdInput from './components/ThresholdInput';
import LoadingIndicator from './components/LoadingIndicator';
import DetectionResults from './components/DetectionResults';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [product, setProduct] = useState(null);
  const [detectionResults, setDetectionResults] = useState([]);
  const [error, setError] = useState(null);
  const [errorThreshold, setErrorThreshold] = useState('2.0');
  const [filteredResults, setFilteredResults] = useState([]);
  const [thresholdMessage, setThresholdMessage] = useState('');
  const [errorFreeProducts, setErrorFreeProducts] = useState([]);
  const [faultyProducts, setFaultyProducts] = useState([]);
  const [zeroErrorMessage, setZeroErrorMessage] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // To prevent unnecessary re-renders
  const dataFetchTimestamp = useRef(0);
  const refreshInterval = useRef(null);

  // API URL based on environment with fallback options
  const [baseUrlIndex, setBaseUrlIndex] = useState(0);
  const baseUrls = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://10.0.2.2:5000',
    'http://192.168.1.100:5000',
    'http://192.168.0.100:5000'
  ];
  
  const getBaseUrl = () => {
    // Platform specific base URL with fallback
    if (Platform.OS === 'android') return baseUrls[2]; // Android emulator
    if (Platform.OS === 'ios') return baseUrls[0];     // iOS simulator
    return baseUrls[baseUrlIndex];                     // Current fallback for web/others
  };
  
  // Try next server if current one fails
  const tryNextServer = () => {
    const nextIndex = (baseUrlIndex + 1) % baseUrls.length;
    console.log(`Trying next server: ${baseUrls[nextIndex]}`);
    setBaseUrlIndex(nextIndex);
    return baseUrls[nextIndex];
  };

  const testConnection = async (tryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Testing connection to: ${getBaseUrl()}, try #${tryCount + 1}`);
      
      const response = await fetchWithTimeout(`${getBaseUrl()}/test`, {
        method: 'GET',
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Server connection successful!");
      
      // If successful, load the data
      loadData();
    } catch (err) {
      console.error("Connection test failed:", err);
      
      // Try next server if this is not the last attempt and it's a network error
      if (tryCount < baseUrls.length - 1 && 
          (err.message.includes('Network request failed') || 
           err.message.includes('Ağ bağlantısı kurulamadı') ||
           err.message.includes('zaman aşımı'))) {
        
        console.log(`Connection failed. Trying next server...`);
        tryNextServer();
        return testConnection(tryCount + 1);
      }
      
      setError(`Sunucuya bağlanılamıyor: ${err.message || 'Bilinmeyen bağlantı hatası'}`);
      setLoading(false);
      
      // Show the error as an alert
      Alert.alert(
        "Bağlantı Hatası",
        `Sunucuya bağlanılamadı. Lütfen sunucu çalışır durumda ve doğru adreste olduğundan emin olun.
        
İpuçları:
- Internet bağlantınızı kontrol edin
- Sunucu çalışır durumda mı?
- Sunucu adresi doğru mu?

Hata: ${err.message || 'Bilinmeyen bağlantı hatası'}`,
        [
          { text: "Tamam" },
          { text: "Tekrar Dene", onPress: () => testConnection(0) }
        ]
      );
    }
  };

  const fetchWithTimeout = (url, options = {}) => {
    console.log(`Fetching: ${url}`);
    const { timeout = 15000 } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        clearTimeout(timeoutId);
        console.log(`Response from ${url}: ${response.status}`);
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.log(`Error fetching ${url}: ${error.message}`);
        
        if (error.name === 'AbortError') {
          throw new Error('İstek zaman aşımına uğradı (Timeout)');
        }
        
        // Extract meaningful message for network errors
        if (error.message.includes('Network request failed')) {
          throw new Error('Ağ bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.');
        }
        
        throw error;
      });
  };

  const fetchStatistics = async (silent = false, retryCount = 0) => {
    if (!silent) setRefreshing(true);
    
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}/api/statistics`);
      if (!response.ok) {
        throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      }
      const data = await response.json();
      setStatistics(data);
      return data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      
      // Try with next server if network error
      if (retryCount < 2 && (
        error.message.includes('Network request failed') || 
        error.message.includes('Ağ bağlantısı kurulamadı') ||
        error.message.includes('zaman aşımı'))) {
        console.log('Retrying statistics with next server...');
        tryNextServer();
        return fetchStatistics(silent, retryCount + 1);
      }
      
      if (!silent) setError(`İstatistikler alınırken hata oluştu: ${error.message || 'Sunucu bağlantı hatası'}`);
      return null;
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const fetchProduct = async (silent = false, retryCount = 0) => {
    if (!silent) setRefreshing(true);
    
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}/api/product`);
      if (!response.ok) {
        throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      }
      const data = await response.json();
      setProduct(data);
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      
      // Try with next server if network error
      if (retryCount < 2 && (
        error.message.includes('Network request failed') || 
        error.message.includes('Ağ bağlantısı kurulamadı') ||
        error.message.includes('zaman aşımı'))) {
        console.log('Retrying product fetch with next server...');
        tryNextServer();
        return fetchProduct(silent, retryCount + 1);
      }
      
      if (!silent) setError(`Ürün bilgisi alınırken hata oluştu: ${error.message || 'Sunucu bağlantı hatası'}`);
      return null;
    } finally {
      if (!silent) setRefreshing(false);
    }
  };
  
  const fetchDetectionResults = async (silent = false, retryCount = 0) => {
    if (!silent) setRefreshing(true);
    
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}/api/image-results?limit=20`);
      if (!response.ok) {
        throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      }
      const data = await response.json();
      setDetectionResults(data);
      applyThresholdFilter(data, parseFloat(errorThreshold));
      return data;
    } catch (error) {
      console.error('Error fetching detection results:', error);
      
      // Try with next server if network error
      if (retryCount < 2 && (
        error.message.includes('Network request failed') || 
        error.message.includes('Ağ bağlantısı kurulamadı') ||
        error.message.includes('zaman aşımı'))) {
        console.log('Retrying detection results with next server...');
        tryNextServer();
        return fetchDetectionResults(silent, retryCount + 1);
      }
      
      if (!silent) setError(`Tespit sonuçları alınırken hata oluştu: ${error.message || 'Sunucu bağlantı hatası'}`);
      return null;
    } finally {
      if (!silent) setRefreshing(false);
    }
  };
  
  // Apply threshold filter to detection results
  const applyThresholdFilter = (results, threshold) => {
    if (!results) return;
    
    const filtered = results.filter(result => {
      // Filter results where confidence score is above the threshold
      return result.confidence_score >= (threshold / 100);
    });
    
    setFilteredResults(filtered);
  };

  const handleApplyThreshold = async () => {
    setThresholdMessage('');
    setZeroErrorMessage(null);
    
    try {
      const threshold = parseFloat(errorThreshold);
      if (isNaN(threshold) || threshold < 0 || threshold > 100) {
        setThresholdMessage('Lütfen 0 ile 100 arasında geçerli bir değer giriniz');
        return;
      }
      
      // Apply to local UI
      applyThresholdFilter(detectionResults, threshold);
      
      // Update on server and get products by threshold
      await updateServerThreshold(threshold);
      await fetchProductsByThreshold();
      
      setThresholdMessage(`Eşik değeri %${threshold} olarak ayarlandı.`);
      
    } catch (e) {
      console.error('Error applying threshold:', e);
      setThresholdMessage('Geçerli bir sayı giriniz.');
    }
  };
  
  // Refresh data when user pulls down to refresh
  const handleManualRefresh = async () => {
    setRefreshing(true);
    
    try {
      const threshold = await fetchThreshold();
      
      await Promise.all([
        fetchStatistics(), 
        fetchProduct(),
        fetchDetectionResults(),
        fetchProductsByThreshold()
      ]);
    } catch (err) {
      console.error("Error during manual refresh:", err);
      setError(`Veri yenilenirken hata oluştu: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Silently refresh data without animation or loading states
  const silentRefresh = async () => {
    const now = Date.now();
    // Only refresh if it's been more than 5 seconds since the last fetch
    if (now - dataFetchTimestamp.current < 5000) return;
    
    if (!error) {
      dataFetchTimestamp.current = now;
      
      try {
        // Fetch threshold first
        const threshold = await fetchThreshold(true);
        
        await Promise.all([
          fetchStatistics(true),
          fetchProduct(true),
          fetchDetectionResults(true),
          fetchProductsByThreshold(true)
        ]);
      } catch (err) {
        console.error("Error during silent refresh:", err);
        // Don't update error state to prevent UI changes
      }
    }
  };
  
  // Load all data
  const loadData = async () => {
    setLoading(true);
    dataFetchTimestamp.current = Date.now();
    
    try {
      // Fetch threshold first
      const threshold = await fetchThreshold();
      
      await Promise.all([
        fetchStatistics(), 
        fetchProduct(),
        fetchDetectionResults(),
        fetchProductsByThreshold()
      ]);
      
      // Only animate on initial load
      if (initialLoad) {
        // Fade in the entire app
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        }).start(() => {
          setInitialLoad(false);
        });
      } else {
        // Skip animation after initial load
        fadeAnim.setValue(1);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError(`Veri yüklenirken hata oluştu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial connection test
  useEffect(() => {
    testConnection();
    
    // Otomatik yenileme kaldırıldı - artık sadece kullanıcı istediğinde yenilenir
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
        refreshInterval.current = null;
      }
    };
  }, []); // Only run on mount

  // Apply initial threshold filter when detection results change
  useEffect(() => {
    if (detectionResults && detectionResults.length > 0) {
      applyThresholdFilter(detectionResults, parseFloat(errorThreshold) || 2.0);
    }
  }, [detectionResults]);

  const fetchThreshold = async (silent = false) => {
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}/api/threshold`);
      if (!response.ok) {
        throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      }
      const data = await response.json();
      if (data.threshold) {
        setErrorThreshold(data.threshold.toString());
      }
      return data.threshold;
    } catch (error) {
      console.error('Error fetching threshold:', error);
      if (!silent) {
        setError(`Eşik değeri alınırken hata oluştu: ${error.message || 'Sunucu bağlantı hatası'}`);
      }
      return parseFloat(errorThreshold);
    }
  };
  
  const updateServerThreshold = async (value) => {
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}/api/threshold`, {
        method: 'POST',
        body: JSON.stringify({ threshold: parseFloat(value) }),
      });
      
      if (!response.ok) {
        throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Threshold updated on server:', data);
      return true;
    } catch (error) {
      console.error('Error updating threshold on server:', error);
      setError(`Eşik değeri güncellenirken hata oluştu: ${error.message || 'Sunucu bağlantı hatası'}`);
      return false;
    }
  };
  
  const fetchProductsByThreshold = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetchWithTimeout(`${getBaseUrl()}/api/products/by-threshold`);
      if (!response.ok) throw new Error(`Sunucu hata kodu döndürdü: ${response.status}`);
      const data = await response.json();
      setErrorFreeProducts(data.error_free || []);
      setFaultyProducts(data.faulty || []);
      setZeroErrorMessage(data.message || null);
      return data;
    } catch (error) {
      if (!silent) setError(`Ürünler alınırken hata oluştu: ${error.message || 'Sunucu bağlantı hatası'}`);
      return null;
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
            />
          }
        >
          <Header />
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={testConnection}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {loading && !statistics ? (
            <LoadingIndicator message="Veriler yükleniyor..." />
          ) : refreshing ? (
            <View style={styles.refreshingIndicator}>
              <Text style={styles.refreshingText}>Yenileniyor...</Text>
            </View>
          ) : (
            <>
              <SummaryCards statistics={statistics} product={product} />
              
              {product && (
                <View style={styles.productInfoCard}>
                  <Text style={styles.productInfoTitle}>{product.name || "Ürün"}</Text>
                  <View style={styles.productInfoStats}>
                    <Text style={styles.productInfoStat}>Üretim: {product.production_count || 0}</Text>
                    <Text style={styles.productInfoStat}>Hata: {product.error_count || 0}</Text>
                    <Text style={styles.productInfoStat}>
                      Hata Oranı: 3.5%
                    </Text>
                  </View>
                </View>
              )}
              
              <ThresholdInput
                value={errorThreshold}
                onChangeText={setErrorThreshold}
                onApply={handleApplyThreshold}
                loading={loading}
                message={thresholdMessage}
              />
              
              {/* Display zero error message if exists */}
              {zeroErrorMessage && (
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>{zeroErrorMessage}</Text>
                </View>
              )}
              
              {/* Products categorized by error rate */}
              {(errorFreeProducts && errorFreeProducts.length > 0) && (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>Hatasız Ürünler (0%)</Text>
                  {errorFreeProducts.map((prod, index) => (
                    <View key={`errorFree-${index}`} style={styles.productItem}>
                      <Text style={styles.productName}>{prod.name}</Text>
                      <Text style={styles.productErrorRate}>{prod.error_rate.toFixed(2)}%</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {(faultyProducts && faultyProducts.length > 0) && (
                <View style={[styles.categoryContainer, styles.faultyContainer]}>
                  <Text style={styles.categoryTitle}>Hatalı Ürünler</Text>
                  {faultyProducts.map((prod, index) => (
                    <View key={`faulty-${index}`} style={styles.productItem}>
                      <Text style={styles.productName}>{prod.name}</Text>
                      <Text style={[styles.productErrorRate, styles.faultyRate]}>3.5%</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <ErrorDistribution statistics={statistics} />
              
              <DetectionResults 
                results={filteredResults.length > 0 ? filteredResults : detectionResults} 
                filtered={filteredResults.length > 0}
                threshold={parseFloat(errorThreshold)}
              />
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
  },
  productInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  productInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  productInfoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  productInfoStat: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 10,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  refreshingIndicator: {
    paddingVertical: 5,
    alignItems: 'center',
  },
  refreshingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  messageContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  messageText: {
    color: '#B91C1C',
    fontSize: 14,
    marginBottom: 10,
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  productName: {
    fontSize: 14,
    color: '#4B5563',
  },
  productErrorRate: {
    fontSize: 14,
    color: '#4B5563',
  },
  faultyContainer: {
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
  },
  faultyRate: {
    color: '#EF4444',
  },
});
