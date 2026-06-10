import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const SPORTS = [
  { id: '1', name: '🏀 Basketball' },
  { id: '2', name: '🎾 Tennis' },
  { id: '3', name: '🥾 Hiking' },
  { id: '4', name: '⚽ Football' },
];

export default function SportsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick an Activity</Text>
      <FlatList 
        data={SPORTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.sportCard} 
            onPress={() => navigation.navigate('Lobby', { sportId: item.id, sportName: item.name })}
          >
            <Text style={styles.sportText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 40 },
  sportCard: { padding: 20, backgroundColor: '#f0f0f0', marginBottom: 10, borderRadius: 8 },
  sportText: { fontSize: 18 }
});