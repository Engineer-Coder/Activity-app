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
import { supabase } from './supabase'; // Adjust this path to match your file structure

export default function ChatRoomScreen({ route }) {
  // Grab the thread details passed from the previous Lobby screen
  const { threadId, threadTitle, threadInfo } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch messages when the screen loads
  useEffect(() => {
    fetchMessages();

    // BETA BONUS: Realtime listener so chats appear instantly without refreshing
    const subscription = supabase
      .channel(`public:messages:thread_id=eq.${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [threadId]);

  // 1. FETCH MESSAGES WITH ERROR CATCHING
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('id', { ascending: true }); // Ordering by your fixed int8 ID column

      if (error) {
        Alert.alert("🚨 Fetch Error", `Supabase rejected loading chats:\n\n${error.message}`);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      Alert.alert("💥 App Crash Error", `Failed to execute fetch operation:\n\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. SEND MESSAGE WITH ERROR CATCHING
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // We pass explicitly NO 'id' so your database sequence auto-generates it, 
      // and 'null' for sender_id so beta testers don't have to log in.
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            thread_id: threadId,
            content: newMessage.trim(),
            sender_id: null 
          }
        ]);

      if (error) {
        Alert.alert("❌ Database Reject Error", `Your code sent the message, but your table rejected it:\n\n${error.message}`);
      } else {
        setNewMessage('');
        // If the realtime subscription is lagging, this manually forces the screen to reload the new text
        fetchMessages(); 
      }
    } catch (err) {
      Alert.alert("💥 App Crash Error", `Failed to execute send operation:\n\n${err.message}`);
    }
  };

  // Render individual chat bubbles
  const renderMessageItem = ({ item }) => (
    <View style={styles.messageBubble}>
      <Text style={styles.messageSender}>Beta User</Text>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        {/* Thread Info Header Box */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>{threadTitle}</Text>
          {threadInfo ? <Text style={styles.headerInfo}>{threadInfo}</Text> : null}
        </View>

        {/* Chat Feed */}
        <FlatList
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.chatFeed}
          refreshing={loading}
          onRefresh={fetchMessages}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No messages here yet. Start the conversation!</Text>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8e8e93"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  headerBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  headerInfo: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4,
  },
  chatFeed: {
    padding: 16,
  },
  messageBubble: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '85%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007aff',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8e8e93',
    marginTop: 40,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    color: '#1c1c1e',
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#007aff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});