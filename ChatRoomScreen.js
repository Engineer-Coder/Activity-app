import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { supabase } from './supabase';

export default function ChatRoomScreen({ route }) {
  const { threadId, threadTitle, details } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // 1. Fetch historical messages for this thread
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // 2. Listen to NEW incoming messages in real-time
    const channel = supabase
      .channel(`room-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }; // Cleanup listener on exit
  }, [threadId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    await supabase.from('messages').insert([{ thread_id: threadId, content: inputText }]);
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{threadTitle}</Text>
      <Text style={styles.details}>{details}</Text>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput value={inputText} onChangeText={setInputText} placeholder="Type a message..." style={styles.chatInput} />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold' },
  details: { color: '#555', marginBottom: 20 },
  messageBubble: { padding: 10, backgroundColor: '#e1ffc7', alignSelf: 'flex-start', borderRadius: 8, marginVertical: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, marginRight: 10, borderRadius: 4 }
});
