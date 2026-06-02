import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from './supabase';

export default function LobbyScreen({ route, navigation }) {
  const { sportId, sportName } = route.params;
  const [threads, setThreads] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');

  // Fetch open threads for this sport from Supabase
  const fetchThreads = async () => {
    let { data, error } = await supabase
      .from('threads')
      .select('*')
      .eq('activity_id', sportId);
    if (!error) setThreads(data);
  };

  useEffect(() => { fetchThreads(); }, []);

  // Create a new matchmaking thread
  const createThread = async () => {
    if (!newTitle) return;
    const { error } = await supabase
      .from('threads')
      .insert([{ activity_id: sportId, title: newTitle, additional_info: newDetails }]);
    
    if (!error) {
      setNewTitle('');
      setNewDetails('');
      fetchThreads(); // Refresh list
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{sportName} Lobby</Text>
      
      {/* Thread Creation Form */}
      <View style={styles.form}>
        <TextInput placeholder="Match Title (e.g., 3v3 Friendly)" value={newTitle} onChangeText={setNewTitle} style={styles.input} />
        <TextInput placeholder="Details (Time, Location)" value={newDetails} onChangeText={setNewDetails} style={styles.input} />
        <Button title="Host a Match" onPress={createThread} />
      </View>

      {/* List of Open Threads */}
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.threadCard}
            onPress={() => navigation.navigate('ChatRoom', { threadId: item.id, threadTitle: item.title, details: item.additional_info })}
          >
            <Text style={styles.threadTitle}>{item.title}</Text>
            <Text style={styles.threadDetails}>{item.additional_info}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 20 },
  form: { marginBottom: 20, padding: 15, backgroundColor: '#e8e8e8', borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 10, backgroundColor: '#fff', borderRadius: 4 },
  threadCard: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  threadTitle: { fontSize: 16, fontWeight: 'bold' },
  threadDetails: { color: '#666' }
});
