import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notifikasiStorage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotifikasiScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotif = async () => {
    try {
      const data = await notifikasiStorage.getAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotif();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotif();
  };

  const handleMarkAllRead = async () => {
    await notifikasiStorage.markAllAsRead();
    await fetchNotif();
    Alert.alert('Sukses', 'Semua notifikasi telah ditandai sebagai dibaca.');
  };

  const handleMarkSingleRead = async (item: any) => {
    if (!item.dibaca) {
      await notifikasiStorage.markAsRead(item.id);
      await fetchNotif();
    }
  };

  const getIconConfig = (tipe: any) => {
    switch (tipe) {
      case 'jadwal':
      case 'perubahan_jadwal':
        return { name: 'event-note', color: '#2563EB', bg: '#DBEAFE' };
      case 'arsip':
        return { name: 'folder-special', color: '#10B981', bg: '#D1FAE5' };
      case 'laporan':
        return { name: 'picture-as-pdf', color: '#9333EA', bg: '#F3E8FF' };
      case 'sync':
        return { name: 'sync', color: '#F59E0B', bg: '#FEF3C7' };
      default:
        return { name: 'notifications', color: PRIMARY.blue, bg: '#EFF6FF' };
    }
  };

  const unreadCount = notifications.filter((n) => !n.dibaca).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Pusat Notifikasi & Alarm</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua notifikasi terbaca'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <MaterialIcons name="done-all" size={20} color={PRIMARY.gold} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PRIMARY.blue} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Memuat notifikasi...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="notifications-none" size={60} color="#94A3B8" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Belum Ada Notifikasi</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Pemberitahuan perubahan jadwal, pengunggahan arsip, dan notulen rapat akan muncul di sini.
            </Text>
          </View>
        ) : (
          notifications.map((item) => {
            const iconConfig = getIconConfig(item.tipe);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notifCard,
                  { backgroundColor: item.dibaca ? theme.surface : '#F0F7FF', borderColor: item.dibaca ? theme.border : '#BFDBFE' },
                  Shadows.sm,
                ]}
                onPress={() => handleMarkSingleRead(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: iconConfig.bg }]}>
                  <MaterialIcons name={iconConfig.name as any} size={22} color={iconConfig.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, { color: theme.text, fontWeight: item.dibaca ? '600' : '800' }]}>
                      {item.judul}
                    </Text>
                    {!item.dibaca && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={[styles.notifPesan, { color: theme.textSecondary }]}>{item.pesan}</Text>
                  {item.createdAt && (
                    <Text style={[styles.notifTime, { color: theme.textTertiary }]}>
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(item.createdAt).toLocaleDateString('id-ID')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY.navy,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: 1,
  },
  markReadBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSizes.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  emptySub: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  notifTitle: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: PRIMARY.blue,
  },
  notifPesan: {
    fontSize: FontSizes.xs,
    marginTop: 3,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 10,
    marginTop: 6,
    fontWeight: '500',
  },
});
