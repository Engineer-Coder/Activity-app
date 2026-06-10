import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from './supabase';

export default function LobbyScreen({ route, navigation }) {
  const { sportId, sportName } = route.params;

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); 
  const [formattedDateTime, setFormattedDateTime] = useState('Select Date & Time');

  useEffect(() => {
  fetchThreads();
}, [fetchThreads]); 

  const fetchThreads = useCallback(async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('threads')
    .select('*')
    .eq('activity_id', sportId)
    .order('id', { ascending: false });
  if (!error) setThreads(data || []);
  setLoading(false);
}, [sportId]); // Safely locks the function signature to the current sportId

  const onDateTimeChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (pickerMode === 'date') {
      setPickerMode('time');
    } else {
      setShowPicker(false);
      setPickerMode('date');
      const humanReadable = currentDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setFormattedDateTime(humanReadable);
    }
  };

  const openDatePicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const createThread = async () => {
    if (!newTitle.trim() || !newLocation.trim() || formattedDateTime === 'Select Date & Time') {
      Alert.alert("Missing Fields", "Please complete all fields!");
      return;
    }
    const totalPlayers = Number(maxPlayers) ? parseInt(maxPlayers, 10) : 10;

    const { error } = await supabase
      .from('threads')
      .insert([
        {
          activity_id: sportId,
          title: newTitle.trim(),
          location: newLocation.trim(),
          event_time: date.toISOString(), 
          max_players: totalPlayers
        }
      ]);

    if (error) {
      Alert.alert("Database Error", error.message);
    } else {
      setNewTitle('');
      setNewLocation('');
      setFormattedDateTime('Select Date & Time');
      setDate(new Date());
      setMaxPlayers('10');
      fetchThreads();
    }
  };

  const renderThreadItem = ({ item }) => {
    const displayTime = item.event_time 
      ? new Date(item.event_time).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      : 'No time set';

    return (
      <TouchableOpacity 
        style={styles.matchCard}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('ChatRoom', {
          threadId: item.id,
          threadTitle: item.title,
          threadInfo: `${displayTime} @ ${item.location}`
        })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.matchTitle}>{item.title}</Text>
          <View style={styles.badgeWrapper}>
            <Text style={styles.playerTag}>👥 Max {item.max_players}</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>📍 <Text style={styles.boldDetail}>{item.location}</Text></Text>
          <Text style={styles.detailText}>🕒 <Text style={styles.boldDetail}>{displayTime}</Text></Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        
        {/* Sleek Input Form Deck */}
        <View style={styles.hostCardContainer}>
          <View style={styles.hostFormCard}>
            <Text style={styles.formHeading}>Host a {sportName} Match</Text>
            
            <TextInput
              style={styles.premiumInput}
              placeholder="Match Description (e.g., 5v5 Competitive Pickup)"
              placeholderTextColor="#999"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            
            <TextInput
              style={styles.premiumInput}
              placeholder="Venue / Pitch Location"
              placeholderTextColor="#999"
              value={newLocation}
              onChangeText={setNewLocation}
            />

            <View style={styles.rowInputs}>
              <TouchableOpacity style={styles.premiumPickerButton} onPress={openDatePicker}>
                <Text style={[styles.pickerButtonText, formattedDateTime !== 'Select Date & Time' && { color: '#1c1c1e', fontWeight: '500' }]}>
                  📅 {formattedDateTime}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.premiumInput, { flex: 1, marginBottom: 0, textAlign: 'center' }]}
                placeholder="Limit"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={maxPlayers}
                onChangeText={setMaxPlayers}
              />
            </View>

            {showPicker && (
              Platform.OS === 'web' ? (
                <View style={styles.webPickerContainer}>
                  <input
                    type="datetime-local"
                    min={new Date().toISOString().slice(0, 16)}
                    style={styles.webHtmlInput}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selectedDate = new Date(e.target.value);
                      setDate(selectedDate);
                      const humanReadable = selectedDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });
                      setFormattedDateTime(humanReadable);
                      setShowPicker(false);
                    }}
                  />
                  <TouchableOpacity style={styles.webCloseBtn} onPress={() => setShowPicker(false)}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <DateTimePicker
                  value={date}
                  mode={pickerMode}
                  is24Hour={false}
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={onDateTimeChange}
                  minimumDate={new Date()}
                />
              )
            )}

            <TouchableOpacity style={styles.premiumHostButton} onPress={createThread} activeOpacity={0.9}>
              <Text style={styles.hostButtonText}>Publish to Live Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clean Match Stream List */}
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderThreadItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchThreads}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matches hosted yet. Tap above to initiate one!</Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  hostCardContainer: { padding: 14, backgroundColor: '#f8f9fa' },
  hostFormCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#eef0f2'
  },
  formHeading: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 14, letterSpacing: -0.3 },
  premiumInput: { 
    backgroundColor: '#f1f3f5', 
    borderRadius: 10, 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#1c1c1e', 
    marginBottom: 12,
    fontWeight: '400'
  },
  rowInputs: { flexDirection: 'row', width: '100%', marginBottom: 14 },
  premiumPickerButton: {
    flex: 2,
    marginRight: 10,
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: 48
  },
  pickerButtonText: { fontSize: 14, color: '#7d868f', fontWeight: '400' },
  premiumHostButton: { 
    backgroundColor: '#10b981', // Premium clean emerald green
    borderRadius: 10, 
    paddingVertical: 14, 
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2
  },
  hostButtonText: { color: '#fff', fontWeight: '600', fontSize: 16, letterSpacing: -0.2 },
  
  listContainer: { paddingHorizontal: 14, paddingBottom: 20 },
  matchCard: { 
    backgroundColor: '#fff', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eef0f2'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  matchTitle: { fontSize: 16, fontWeight: '700', color: '#1a1d20', flex: 1, marginRight: 10, letterSpacing: -0.2 },
  badgeWrapper: { backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  playerTag: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
  divider: { height: 1, backgroundColor: '#f1f3f5', marginVertical: 12 },
  detailsRow: { flexDirection: 'column', gap: 6 },
  detailText: { fontSize: 14, color: '#6c757d' },
  boldDetail: { color: '#343a40', fontWeight: '500' },
  emptyText: { textAlign: 'center', color: '#868e96', marginTop: 40, fontSize: 14 },
  
  webPickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f3f5', padding: 8, borderRadius: 10, marginBottom: 12 },
  webHtmlInput: { flex: 1, padding: 8, borderRadius: 6, border: 'none', fontSize: '15px', backgroundColor: '#fff', color: '#1c1c1e' },
  webCloseBtn: { marginLeft: 10, backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }
});