import { Colors, FontSizes, PRIMARY, Radius, Shadows, Spacing } from '../constants/theme';
import { useColorScheme } from '../hooks/use-color-scheme';
import { userStorage } from '../utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const DEMO_USERS = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    displayName: 'Admin Utama Sekretariat',
    roleLabel: 'Admin / Sekretariat DPRD',
    role: 'admin',
    desc: 'Akses penuh kelola jadwal, arsip & absensi',
    icon: 'admin-panel-settings',
    color: '#EF4444',
  },
  {
    id: 'sekretariat',
    username: 'sekretariat',
    password: 'sekretariat123',
    displayName: 'Staf Sekretariat Komisi',
    roleLabel: 'Sekretariat DPRD',
    role: 'sekretariat',
    desc: 'Input jadwal, buat notulen & cetak PDF',
    icon: 'assignment-ind',
    color: '#2563EB',
  },
  {
    id: 'anggota',
    username: 'anggota',
    password: 'anggota123',
    displayName: 'H. Ahmad Subagja, S.T.',
    roleLabel: 'Anggota DPRD (Komisi I)',
    role: 'anggota',
    desc: 'Absensi QR, lihat agenda & unduh berkas',
    icon: 'badge',
    color: '#10B981',
  },
  {
    id: 'pimpinan',
    username: 'pimpinan',
    password: 'pimpinan123',
    displayName: 'Dr. H. Bambang Yudi, S.H.',
    roleLabel: 'Ketua DPRD / Pimpinan',
    role: 'pimpinan',
    desc: 'Monitoring laporan, presensi & perubahan',
    icon: 'stars',
    color: '#F59E0B',
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await userStorage.getCurrentUser();
      if (currentUser) {
        router.replace('/(tabs)');
      }
    };

    checkSession();
  }, []);

  const handleSelectRole = (user: any) => {
    setSelectedRole(user.id);
    setUsername(user.username);
    setPassword(user.password);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Login gagal', 'Username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    const match = DEMO_USERS.find(
      (user) => user.username === username.trim().toLowerCase() && user.password === password
    );

    if (match) {
      await userStorage.saveCurrentUser(match);
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login gagal', 'Username atau password salah.');
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: PRIMARY.navy }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* HEADER LOGO */}
          <View style={styles.headerBox}>
            <View style={styles.govBadge}>
              <MaterialIcons name="account-balance" size={24} color={PRIMARY.gold} />
            </View>
            <Text style={styles.brandTitle}>SIM KOMISI DPRD</Text>
            <Text style={styles.brandSub}>Sistem Informasi Kegiatan Komisi I – V</Text>
          </View>

          {/* CARD CONTAINER */}
          <View style={[styles.card, { backgroundColor: theme.surface }, Shadows.md]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Masuk Aplikasi</Text>
            <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
              Silakan masukkan kredensial atau pilih Role Demo di bawah.
            </Text>

            {/* INPUT USERNAME */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <MaterialIcons name="person-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Masukkan username"
                  placeholderTextColor={theme.textTertiary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* INPUT PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <MaterialIcons name="lock-outline" size={20} color={theme.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Masukkan password"
                  placeholderTextColor={theme.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* BUTTON LOGIN */}
            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
              <Text style={styles.loginBtnText}>{isLoading ? 'Memproses Hak Akses...' : 'Masuk Sistem'}</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>

            {/* DEMO ROLE SELECTOR CHIPS */}
            <View style={styles.roleSection}>
              <View style={styles.roleHeaderRow}>
                <MaterialIcons name="touch-app" size={16} color={PRIMARY.blue} />
                <Text style={[styles.roleSectionTitle, { color: theme.text }]}>Pilih Role Akses Demo (Quick Fill):</Text>
              </View>

              <View style={styles.roleGrid}>
                {DEMO_USERS.map((user) => {
                  const isSelected = selectedRole === user.id || username === user.username;
                  return (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.roleCard,
                        {
                          borderColor: isSelected ? user.color : theme.border,
                          backgroundColor: isSelected ? `${user.color}10` : theme.background,
                        },
                      ]}
                      onPress={() => handleSelectRole(user)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.roleIconBox, { backgroundColor: `${user.color}20` }]}>
                        <MaterialIcons name={user.icon as any} size={20} color={user.color} />
                      </View>
                      <View style={styles.roleTextGroup}>
                        <Text style={[styles.roleName, { color: theme.text }]}>{user.roleLabel}</Text>
                        <Text style={[styles.roleDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                          {user.desc}
                        </Text>
                      </View>
                      {isSelected ? <MaterialIcons name="check-circle" size={18} color={user.color} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <Text style={styles.footerText}>
            © 2026 Sekretariat DPRD Kabupaten / Kota • All Rights Reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  govBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: PRIMARY.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: FontSizes.xs,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: FontSizes.xs,
    marginTop: -4,
    marginBottom: Spacing.xs,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY.blue,
    height: 50,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: FontSizes.base,
    fontWeight: '800',
  },
  roleSection: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: Spacing.md,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleSectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
  },
  roleGrid: {
    gap: Spacing.xs + 2,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  roleIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextGroup: {
    flex: 1,
  },
  roleName: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  footerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
});

