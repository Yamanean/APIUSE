import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import Papa from 'papaparse';

const apiKey = 'NPCK31GLN8U5NM4N';

const StockList = ({ onSelectStock }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`,
          { responseType: 'text' }
        );

        if (response.data.includes('symbol,')) {
          const parsed = Papa.parse(response.data, { header: true });
          const filteredStocks = parsed.data.filter(stock => stock.symbol && stock.name);
          
          if (filteredStocks.length > 0) {
            setStocks(filteredStocks);
          } else {
            setError('Nenhum ativo encontrado.');
          }
        } else {
          setError('Resposta inválida da API. Talvez o limite tenha sido atingido.');
        }
      } catch (err) {
        setError('Erro ao buscar os dados');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (stocks.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Nenhum ativo encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stocks}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelectStock(item.symbol)}>
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.symbol}>{item.symbol}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const StockDetails = ({ stockSymbol, onGoBack }) => {
  const [stockDetails, setStockDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockDetails = async () => {
      try {
        const response = await axios.get(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${stockSymbol}&apikey=${apiKey}`
        );
        const timeSeries = response.data['Time Series (Daily)'];
        if (!timeSeries) {
          setError('Dados não disponíveis para este ativo.');
        } else {
          setStockDetails(timeSeries);
        }
      } catch (err) {
        setError('Erro ao buscar os detalhes');
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetails();
  }, [stockSymbol]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  const entries = Object.entries(stockDetails).slice(0, 5); // Últimos 5 dias

  return (
    <View style={styles.container}>
      {entries.map(([date, data]) => (
        <View key={date} style={styles.detailCard}>
          <Text style={styles.name}>{date}</Text>
          <Text>Abertura: {data['1. open']}</Text>
          <Text>Fechamento: {data['4. close']}</Text>
          <Text>Máxima: {data['2. high']}</Text>
          <Text>Mínima: {data['3. low']}</Text>
        </View>
      ))}
      <TouchableOpacity onPress={onGoBack} style={styles.goBackButton}>
        <Text style={styles.goBackText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
};

const App = () => {
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);

  return (
    <View style={styles.container}>
      {selectedStockSymbol ? (
        <StockDetails
          stockSymbol={selectedStockSymbol}
          onGoBack={() => setSelectedStockSymbol(null)}
        />
      ) : (
        <StockList onSelectStock={(symbol) => setSelectedStockSymbol(symbol)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: 'red',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  symbol: {
    color: '#6c757d',
  },
  detailCard: {
    backgroundColor: '#e9ecef',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  goBackButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  goBackText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;
