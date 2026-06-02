import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import React, { useLayoutEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { supabase } from './supabase'; 

const SPORTS = [
  { id: '1', name: '🏀 Basketball' },
  { id: '2', name: '🎾 Tennis' },
  { id: '3', name: '🥾 Hiking' },
  { id: '4', name: '⚽ Football' },
];

export default function SportsScreen({ navigation }) {
  useLayoutEffect(() => {
  navigation.setOptions({
    headerRight: () => (
      <TouchableOpacity 
        onPress={async () => {
          await supabase.auth.signOut();
          // Supabase will wipe the local session, and App.js will instantly snap back to the Register/Login screen!
        }}
        style={{ marginRight: 15 }}
      >
        <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Sign Out</Text>
      </TouchableOpacity>
    ),
  });
}, [navigation]);
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
