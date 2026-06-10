import React, { useState, useEffect } from 'react';
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
// 1. Import the Native Date/Time Picker component
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from './supabase';

export default function LobbyScreen({ route, navigation }) {
  const { sportId, sportName } = route.params;

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('10');

  // 2. Date/Time State Variables
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date' or 'time'
  const [formattedDateTime, setFormattedDateTime] = useState('Select Date & Time');

  useEffect(() => {
    fetchThreads();
  }, [sportId]);

  const fetchThreads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('activity_id', sportId)
      .order('id', { ascending: false });
    if (!error) setThreads(data || []);
    setLoading(false);
  };

  // 3. Handle when a user selects a date or time from the popup
  const onDateTimeChange = (event, selectedDate) => {
    // If user clicks "Cancel", close the picker
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (pickerMode === 'date') {
      // Date selected, now immediately launch the Clock Picker!
      setPickerMode('time');
    } else {
      // Time selected, we are done! Close it down and format the display text
      setShowPicker(false);
      setPickerMode('date'); // reset mode back to date for next use
      
      // Turn raw date into a beautiful readable format: "Jun 10, 6:30 PM"
      const formatted = currentDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      setFormattedDateTime(formatted);
    }
  };

  // Trigger the popup sequence
  const openDatePicker = () => {
    setPickerMode('date');
    setShowPicker(true);
  };

  const createThread = async () => {
    if (!newTitle.trim() || !newLocation.trim() || formattedDateTime === 'Select Date & Time') {
      Alert.alert("Missing Fields", "Please complete all fields, including Date & Time!");
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
          event_time: formattedDateTime, // Submits the clean string directly to your text column
          max_players: totalPlayers
        }
      ]);

    if (error) {
      Alert.alert("Database Error", error.message);
    } else {
      Alert.alert("Success 🎉", "Match hosted successfully!");
      setNewTitle('');
      setNewLocation('');
      setFormattedDateTime('Select Date & Time');
      setMaxPlayers('10');
      fetchThreads();
    }
  };

  const renderThreadItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.matchCard}
      onPress={() => navigation.navigate('ChatRoom', {
        threadId: item.id,
        threadTitle: item.title,
        threadInfo: `${item.event_time} @ ${item.location}`
      })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.matchTitle}>{item.title}</Text>
        <Text style={styles.playerTag}>👥 Max: {item.max_players}</Text>
      </View>
      <Text style={styles.matchDetails}>📍 {item.location}</Text>
      <Text style={styles.matchDetails}>🕒 {item.event_time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.hostForm}>
          <Text style={styles.formHeading}>Host a New Match</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Match Title (e.g., 5v5 Casual Pickup)"
            placeholderTextColor="#8e8e93"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location (e.g., Central Park Pitch 3)"
            placeholderTextColor="#8e8e93"
            value={newLocation}
            onChangeText={setNewLocation}
          />

          <View style={styles.rowInputs}>
            {/* 4. Clickable Custom Button replaces the old manual Text Input */}
            <TouchableOpacity style={styles.pickerButton} onPress={openDatePicker}>
              <Text style={[styles.pickerButtonText, formattedDateTime !== 'Select Date & Time' && { color: '#1c1c1e' }]}>
                📅 {formattedDateTime}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Max Players"
              placeholderTextColor="#8e8e93"
              keyboardType="numeric"
              value={maxPlayers}
              onChangeText={setMaxPlayers}
            />
          </View>

          {/* 5. The invisible wrapper that fires up when showPicker is true */}
          {showPicker && (
            <DateTimePicker
              value={date}
              mode={pickerMode}
              is24Hour={false}
              display={Platform.OS === 'android' ? 'default' : 'spinner'}
              onChange={onDateTimeChange}
              minimumDate={new Date()} // Prevents hosts from hosting games in the past
            />
          )}

          <TouchableOpacity style={styles.hostButton} onPress={createThread}>
            <Text style={styles.hostButtonText}>Publish Match</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={threads}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderThreadItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchThreads}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matches scheduled yet.</Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  hostForm: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5ea', elevation: 2 },
  formHeading: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 12 },
  input: { backgroundColor: '#f5f5f7', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#1c1c1e', marginBottom: 10, borderWidth: 1, borderColor: '#e5e5ea' },
  rowInputs: { flexDirection: 'row', width: '100%', marginBottom: 12 },
  
  // Custom design for our date selection block
  pickerButton: {
    flex: 2,
    marginRight: 8,
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 46 // Force height alignment with the TextInput field next to it
  },
  pickerButtonText: { fontSize: 15, color: '#8e8e93' },
  
  hostButton: { backgroundColor: '#34c759', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  hostButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContainer: { padding: 16 },
  matchCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e5ea', elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  matchTitle: { fontSize: 16, fontWeight: 'bold', color: '#1c1c1e', flex: 1, marginRight: 8 },
  playerTag: { fontSize: 13, fontWeight: '600', color: '#007aff', backgroundColor: '#e1f0ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  matchDetails: { fontSize: 14, color: '#8e8e93', marginTop: 3 },
  emptyText: { textAlign: 'center', color: '#8e8e93', marginTop: 40, fontSize: 14 }
}); // Note: Cut short for clarity, Expo Snack will merge your existing/updated styles gracefully!