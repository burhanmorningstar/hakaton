import React, { useRef, useEffect, memo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator,
  Animated
} from 'react-native';

const ThresholdInput = memo(({ value, onChangeText, onApply, loading, message }) => {
  const containerAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  // Use this to avoid frequent re-renders when typing
  const handleChangeText = (text) => {
    // Only update if value has actually changed
    if (text !== prevValue.current) {
      prevValue.current = text;
      onChangeText(text);
    }
  };
  
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
      <Text style={styles.title}>Hata Oranı Filtreleme</Text>
      
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleChangeText}
            keyboardType="numeric"
            placeholder="Eşik değeri (ör: 2.0)"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.inputSuffix}>%</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={onApply}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Uygula</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
      
      <Text style={styles.helperText}>
        Bu eşik değeri üzerinde hata oranına sahip ürünler "hatalı" olarak gösterilecektir.
      </Text>
    </Animated.View>
  );
});

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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#111827',
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
    paddingLeft: 5,
  },
  button: {
    height: 45,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  message: {
    marginTop: 10,
    color: '#B91C1C',
    fontSize: 13,
  },
  helperText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
  }
});

export default ThresholdInput; 