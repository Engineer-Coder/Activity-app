import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  Image
} from 'react-native';
import { supabase } from './supabase';


export default function SportsScreen({ navigation }) {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSports();
  }, []);

  // Fetch the sport categories from your Supabase table
  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('activities') // Assumes your sports table is called 'activities'
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.log("Error fetching sports:", error.message);
      } else {
        setSports(data || []);
      }
    } catch (err) {
      console.log("Crash error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to map sport names to clean visual emojis/icons automatically
  const getSportIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('soccer') || lower.includes('foot')) return '⚽';
    if (lower.includes('basket')) return '🏀';
    if (lower.includes('tenis') || lower.includes('tennis')) return '🎾';
    if (lower.includes('volley')) return '🏐';
    if (lower.includes('run') || lower.includes('track')) return '🏃';
    if (lower.includes('gym') || lower.includes('lift')) return '🏋️';
    return '🏆'; // Default premium trophy badge
  };

  const renderSportCard = ({ item }) => {
  const fallbackAsset = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&q=80';
  
  // Clean up any potential whitespace issues from the database string
  const uriTarget = item.image_url && item.image_url.trim() !== '' ? item.image_url.trim() : fallbackAsset;

  return (
    <TouchableOpacity
      style={styles.sportCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Lobby', {
        sportId: item.id,
        sportName: item.name
      })}
    >
      <Image 
        source={{ uri: uriTarget }} 
        style={styles.cardImageHero} 
        resizeMode="cover"
        // If the browser or phone still blocks the image, default to the fallback soccer field automatically
        defaultSource={{ uri: fallbackAsset }} 
      />
      
      <View style={styles.cardTextContent}>
        <Text style={styles.sportName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardActionText}>Explore Lobbies →</Text>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Welcome Header */}
      <View style={styles.welcomeHeader}>
        <Text style={styles.appSubtitle}>MATCHMAKING UTILITY</Text>
        <Text style={styles.appTitle}>Select Your Discipline</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Synchronizing with map engine...</Text>
        </View>
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSportCard}
          numColumns={2} // Transformed into a clean 2-column dashboard layout
          columnWrapperStyle={styles.rowGrid}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active sports loaded in database configuration.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  welcomeHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 14,
    backgroundColor: '#f8f9fa',
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4f46e5', // High-end indigo focus tag
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    letterSpacing: -0.5,
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  rowGrid: {
    justifyContent: 'space-between',
  },
  sportCard: {
  backgroundColor: '#fff',
  borderRadius: 16,
  marginBottom: 14,
  width: '48%', 
  overflow: 'hidden', // Crucial: clips the image corner bounds to match the card border radius
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.03,
  shadowRadius: 8,
  elevation: 2,
  borderWidth: 1,
  borderColor: '#eef0f2',
},
cardImageHero: {
  width: '100%',
  height: 105, // Sets a clean landscape profile for the category thumbnail
  backgroundColor: '#e2e8f0', // Soft placeholder tint shown while download completes
},
cardTextContent: {
  padding: 12,
  alignItems: 'center',
},
sportName: {
  fontSize: 14,
  fontWeight: '700',
  color: '#1e293b',
  textAlign: 'center',
  marginBottom: 4,
},
cardActionText: {
  fontSize: 11,
  fontWeight: '600',
  color: '#2563eb',
},
    loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#868e96',
    marginTop: 60,
    fontSize: 14,
  },
});