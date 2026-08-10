import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearAllData, seedMockData, userStorage } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MenuScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const [activeUser, setActiveUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const user = await userStorage.getCurrentUser();
      if (mounted) {
        setActiveUser(user);
      }
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const menuSections = [
    {
      title: 'Fitur Utama Komisi I–V',
      items: [
        {
          id: 'absensi',
          label: 'Presensi & Absensi Anggota',
          sub: 'Scan QR Code kehadiran per kegiatan',
          icon: 'qr-code-scanner',
          color: '#10B981',
          bgColor: '#D1FAE5',
          route: '/absensi/rekap',
        },
        {
          id: 'rapat',
          label: 'Modul Rapat & Notulen',
          sub: 'Kelola agenda, notulen & berita acara',
          icon: 'meeting-room',
          color: '#2563EB',
          bgColor: '#DBEAFE',
          route: '/rapat/notulen',
        },
        {
          id: 'perubahan',
          label: 'Perubahan Penjadwalan',
          sub: 'Riwayat reschedule & alasan perubahan',
          icon: 'published-with-changes',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          route: '/jadwal/edit',
        },
        {
          id: 'laporan',
          label: 'Modul Laporan PDF Resmi',
          sub: 'Cetak laporan kegiatan & presensi',
          icon: 'assessment',
          color: '#9333EA',
          bgColor: '#F3E8FF',
          route: '/laporan',
        },
      ],
    },
    {
      title: 'Sistem & Hak Akses',
      items: [
        {
          id: 'notifikasi',
          label: 'Notifikasi & Pengingat',
          sub: 'Pengaturan alarm & notifikasi jadwal',
          icon: 'notifications',
          color: '#2563EB',
          bgColor: '#DBEAFE',
          route: '/notifikasi',
        },
        {
          id: 'hak-akses',
          label: 'Pengguna & Hak Akses',
          sub: 'Admin, Sekretariat, Anggota, Pimpinan',
          icon: 'admin-panel-settings',
          color: '#EF4444',
          bgColor: '#FEE2E2',
        },
        {
          id: 'reset',
          label: 'Reset Data Mock',
          sub: 'Bersihkan & kembalikan data ke awal',
          icon: 'refresh',
          color: '#64748B',
          bgColor: '#F1F5F9',
        },
      ],
    },
  ];

  const handleMenuPress = (item) => {
    if (item.route) {
      router.push(item.route);
    } else if (item.id === 'reset') {
      Alert.alert(
        'Reset Data',
        'Apakah Anda yakin ingin menghapus seluruh data dan mengembalikan ke data awal (mock)?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Reset Data',
            style: 'destructive',
            onPress: async () => {
              await clearAllData();
              await seedMockData();
              Alert.alert('Sukses', 'Data berhasil di-reset ke kondisi awal.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        item.label,
        `Role & Hak Akses: Terhubung sebagai Admin Sekretariat DPRD.`
      );
    }
  };

  const handleLogout = async () => {
    await userStorage.clearCurrentUser();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: PRIMARY.navy }]}>
        <Text style={styles.headerTitle}>Menu & Pengaturan</Text>
        <Text style={styles.headerSub}>Sistem Informasi Manajemen DPRD</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* USER CARD PROFILE */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <View style={[styles.avatar, { backgroundColor: PRIMARY.navy }]}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {activeUser?.displayName || 'Admin Sekretariat'}
            </Text>
            <Text style={[styles.userRole, { color: theme.textSecondary }]}> 
              Hak Akses: {activeUser?.roleLabel || 'Admin / Sekretariat DPRD'}
            </Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Aktif</Text>
          </View>
        </View>

        {/* SECTIONS */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <View style={[styles.menuListCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuRow,
                    itemIdx < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.borderLight,
                    },
                  ]}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                    <MaterialIcons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                    <Text style={[styles.menuSub, { color: theme.textSecondary }]}>{item.sub}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.versionText, { color: theme.textTertiary }]}>
          SIM Kegiatan Komisi I–V DPRD Mobile v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: 2,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  userRole: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  section: {
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuListCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  menuSub: {
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    marginVertical: Spacing.md,
  },
});
