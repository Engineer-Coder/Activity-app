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
import { supabase } from './supabase';

export default function ChatRoomScreen({ route }) {
  const { threadId, threadTitle, threadInfo } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [participantCount, setParticipantCount] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
  fetchMessages();
  fetchMatchDetailsAndRoster();

  const msgSubscription = supabase
    .channel(`public:messages:thread_id=eq.${threadId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.'${threadId}'` }, (payload) => {
      setMessages((prevMessages) => [...prevMessages, payload.new]);
    })
    .subscribe();

  const rosterSubscription = supabase
    .channel(`public:participants:thread_id=eq.${threadId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `thread_id=eq.'${threadId}'` }, () => {
      fetchMatchDetailsAndRoster();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(msgSubscription);
    supabase.removeChannel(rosterSubscription);
  };
}, [threadId, fetchMessages, fetchMatchDetailsAndRoster]); // ✨ Added both functions here safely!

  // 1. FETCH MATCH DETAILS & ROSTER COUNT (Wrapped in useCallback)
const fetchMatchDetailsAndRoster = useCallback(async () => {
  try {
    const { data: threadData } = await supabase
      .from('threads')
      .select('max_players')
      .eq('id', threadId)
      .single();
    
    if (threadData) setMaxPlayers(threadData.max_players || 10);

    const { count, error } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId);

    if (!error) setParticipantCount(count || 0);
  } catch (err) {
    console.log(err.message);
  }
}, [threadId]); // Triggers only if threadId updates

  const toggleMatchParticipation = async () => {
    if (!hasJoined) {
      if (participantCount >= maxPlayers) {
        Alert.alert("Match Full 🚫", "Sorry, all spots for this match are taken!");
        return;
      }
      try {
        const { error } = await supabase
          .from('participants')
          .insert([{ thread_id: threadId, player_name: 'Beta Player' }]);

        if (!error) {
          setHasJoined(true);
          fetchMatchDetailsAndRoster();
        }
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    } else {
      try {
        const { error } = await supabase
          .from('participants')
          .delete()
          .eq('thread_id', threadId)
          .eq('player_name', 'Beta Player')
          .limit(1);

        if (!error) {
          setHasJoined(false);
          fetchMatchDetailsAndRoster();
        }
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    }
  };

  // 2. FETCH CHAT MESSAGES (Wrapped in useCallback)
const fetchMessages = useCallback(async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('id', { ascending: true });
  if (!error) setMessages(data || []);
  setLoading(false);
}, [threadId]); // Triggers only if threadId updates

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase
      .from('messages')
      .insert([{ thread_id: threadId, content: newMessage.trim(), sender_id: null }]);
    if (!error) {
      setNewMessage('');
      fetchMessages();
    }
  };

  const renderMessageItem = ({ item }) => {
    // For testing simulation, we format chat bubbles into beautifully rounded blocks
    return (
      <View style={styles.bubbleContainer}>
        <View style={styles.premiumMessageBubble}>
          <Text style={styles.premiumMessageSender}>Beta Runner</Text>
          <Text style={styles.premiumMessageText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Modern Dashboard Header Banner */}
        <View style={styles.premiumHeaderCard}>
          <View style={styles.headerLayoutRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainHeaderTitle}>{threadTitle}</Text>
              <Text style={styles.mainHeaderSub}>{threadInfo}</Text>
            </View>
            <View style={styles.premiumCounterBadge}>
              <Text style={styles.counterBadgeText}>👥 {participantCount}/{maxPlayers}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.premiumJoinButton, hasJoined && styles.premiumLeaveButton]} 
            onPress={toggleMatchParticipation}
            activeOpacity={0.85}
          >
            <Text style={styles.joinBtnText}>
              {hasJoined ? '❌ Resign From Match Roster' : '⚡ Lock In My Spot'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clean Feed Stream */}
        <FlatList
          data={messages}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.premiumChatFeed}
          refreshing={loading}
          onRefresh={fetchMessages}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyFeedText}>No coordinates shared yet. Align details below!</Text>
          }
        />

        {/* Floating Input Toolbar */}
        <View style={styles.premiumInputContainer}>
          <TextInput
            style={styles.premiumChatTextInput}
            placeholder="Broadcast a message..."
            placeholderTextColor="#a0a5ab"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.premiumSendButton} onPress={sendMessage} activeOpacity={0.8}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  premiumHeaderCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: '#eef0f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 3
  },
  headerLayoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  mainHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#111', letterSpacing: -0.3 },
  mainHeaderSub: { fontSize: 13, color: '#6c757d', marginTop: 2, fontWeight: '400' },
  
  premiumCounterBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30 },
  counterBadgeText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  
  premiumJoinButton: { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  premiumLeaveButton: { backgroundColor: '#dc2626' },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 15, letterSpacing: -0.2 },
  
  premiumChatFeed: { padding: 16 },
  bubbleContainer: { width: '100%', marginBottom: 12, alignItems: 'flex-start' },
  premiumMessageBubble: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    borderRadius: 16, 
    borderTopLeftRadius: 4, 
    maxWidth: '85%', 
    borderWidth: 1,
    borderColor: '#eef0f2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1
  },
  premiumMessageSender: { fontSize: 11, fontWeight: '700', color: '#4f46e5', marginBottom: 3, uppercase: true, letterSpacing: 0.2 },
  premiumMessageText: { fontSize: 15, color: '#2d3748', lineHeight: 20 },
  emptyFeedText: { textAlign: 'center', color: '#a0a5ab', marginTop: 30, fontSize: 14 },
  
  premiumInputContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 14, 
    paddingVertical: 12, 
    backgroundColor: '#fff', 
    borderTopWidth: 1, 
    borderColor: '#eef0f2', 
    alignItems: 'center' 
  },
  premiumChatTextInput: { 
    flex: 1, 
    backgroundColor: '#f1f3f5', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    fontSize: 15, 
    maxHeight: 90, 
    color: '#1c1c1e' 
  },
  premiumSendButton: { marginLeft: 12, backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 }
});