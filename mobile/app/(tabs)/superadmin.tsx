import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '../../contexts/AuthContext';

export default function SuperadminScreen() {
  const { token, API_URL } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/superadmin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'list' })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (userId, newPlan) => {
    try {
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
      await fetch(`${API_URL}/superadmin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'update', payload: { userId, plan: newPlan } })
      });
    } catch (e) {
      console.error(e);
      fetchUsers(); // Revert on error
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'No Name'} (@{item.username})</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, item.plan === 'freelancer' && styles.btnActive]}
          onPress={() => updatePlan(item.id, 'freelancer')}
        >
          <Text style={[styles.btnText, item.plan === 'freelancer' && styles.btnTextActive]}>Free</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, item.plan === 'portfolio' && styles.btnActive]}
          onPress={() => updatePlan(item.id, 'portfolio')}
        >
          <Text style={[styles.btnText, item.plan === 'portfolio' && styles.btnTextActive]}>Port</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, item.plan === 'agency' && styles.btnActive]}
          onPress={() => updatePlan(item.id, 'agency')}
        >
          <Text style={[styles.btnText, item.plan === 'agency' && styles.btnTextActive]}>Agncy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
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
    marginBottom: 16,
    backgroundColor: 'transparent'
  },
  userCard: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
    backgroundColor: 'transparent'
  },
  userName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#aaa',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent'
  },
  btn: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  btnText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnTextActive: {
    color: '#000'
  }
});
