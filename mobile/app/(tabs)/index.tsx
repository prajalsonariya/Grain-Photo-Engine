import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '../../contexts/AuthContext';
import { SymbolView } from 'expo-symbols';

export default function FoldersScreen() {
  const { token, API_URL } = useAuth();
  const [publicFolders, setPublicFolders] = useState([]);
  const [privateFolders, setPrivateFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setPublicFolders(data.publicCollections?.folders || []);
        setPrivateFolders(data.privateCollections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.folderCard}>
      <SymbolView name={{ ios: 'folder.fill', android: 'folder', web: 'folder' }} size={30} tintColor="#fff" />
      <View style={styles.folderInfo}>
        <Text style={styles.folderName}>{item.name}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Public Collection</Text>
      {publicFolders.length === 0 ? (
        <Text style={styles.empty}>No folders yet.</Text>
      ) : (
        <FlatList
          data={publicFolders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}

      <Text style={styles.header}>Private Albums</Text>
      {privateFolders.length === 0 ? (
        <Text style={styles.empty}>No private albums yet.</Text>
      ) : (
        <FlatList
          data={privateFolders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: 'transparent'
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  folderInfo: {
    marginLeft: 16,
    backgroundColor: 'transparent'
  },
  folderName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  empty: {
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: 'transparent'
  }
});
