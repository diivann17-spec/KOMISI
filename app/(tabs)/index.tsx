import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DocumentCard from '../../components/DocumentCard';
import EmptyState from '../../components/EmptyState';
import ScheduleCard from '../../components/ScheduleCard';
import StatCard from '../../components/StatCard';
import { DAFTAR_KOMISI } from '../../constants/data';
import { Colors, FontSizes, KOMISI_COLORS, PRIMARY, Radius, Shadows, Spacing } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { useDashboard } from '../../hooks/useDashboard';
import { notifikasiStorage, userStorage } from '../../utils/storage';

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { stats, todaySchedule, recentDocs, refreshing, onRefresh } = useDashboard();

  const loadNotifCount = async () => {
    const unread = await notifikasiStorage.getUnread();
    setUnreadCount(unread.length);
  };

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const user = await userStorage.getCurrentUser();
      if (mounted) {
        setActiveUser(user);
      }
    };

    loadUser();
    loadNotifCount();
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifCount();
      onRefresh(); // Memuat ulang data dashboard setiap kali layar ini mendapat fokus
    }, [])
  );
  const totalPresensi = stats.hadirCount + stats.tidakHadirCount;
  const persentaseKehadiran = totalPresensi > 0 ? Math.round((stats.hadirCount / totalPresensi) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY.navy} />

      {/* HERO HEADER WITH DEEP NAVY GRADIENT FEEL */}
      <View style={styles.heroHeader}>
        <View style={styles.headerTop}>
          <View style={styles.badgeGov}>
            <MaterialIcons name="account-balance" size={14} color={PRIMARY.gold} />
            <Text style={styles.badgeGovText}>DPRD KABUPATEN / KOTA</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifikasi' as any)}>
            <MaterialIcons name="notifications-none" size={22} color="#FFF" />
            {unreadCount > 0 ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Sistem Informasi Kegiatan</Text>
        <Text style={styles.heroSubtitle}>Komisi I, II, III, IV & V DPRD</Text>

        {activeUser ? (
          <View style={[styles.userBanner, activeUser.role === 'pimpinan' && styles.userBannerPimpinan]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.userBannerTitle}>Selamat datang, {activeUser.displayName}</Text>
                <Text style={styles.userBannerSub}>Role aktif: {activeUser.roleLabel}</Text>
              </View>
              {activeUser.role === 'pimpinan' && (
                <View style={styles.pimpinanBadge}>
                  <MaterialIcons name="stars" size={14} color="#78350F" />
                  <Text style={styles.pimpinanBadgeText}>Pimpinan</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {/* SCAN PDF FAST BANNER - DISESUAIKAN UNTUK PIMPINAN */}
        {activeUser?.role === 'pimpinan' ? (
          <TouchableOpacity
            style={[styles.heroScanBtn, { backgroundColor: 'rgba(245, 158, 11, 0.25)', borderColor: '#F59E0B' }]}
            onPress={() => router.push('/absensi/rekap' as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.heroScanIconBg, { backgroundColor: '#F59E0B' }]}>
              <MaterialIcons name="insights" size={22} color="#FFF" />
            </View>
            <View style={styles.heroScanTextContainer}>
              <Text style={styles.heroScanTitle}>Executive Overview & Kuorum</Text>
              <Text style={styles.heroScanSub}>Pantau kehadiran & kedisiplinan seluruh Komisi I–V</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.heroScanBtn}
            onPress={() => router.push('/arsip/scan' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.heroScanIconBg}>
              <MaterialIcons name="document-scanner" size={22} color={PRIMARY.navy} />
            </View>
            <View style={styles.heroScanTextContainer}>
              <Text style={styles.heroScanTitle}>Scan Berkas Fisik → PDF</Text>
              <Text style={styles.heroScanSub}>Fitur kamera digitalisasi arsip komisi</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* RESCHEDULE ALERT BANNER */}
        <View style={[styles.alertBanner, Shadows.sm]}>
          <View style={styles.alertIconBox}>
            <MaterialIcons name="campaign" size={20} color={PRIMARY.blue} />
          </View>
          <View style={styles.alertTextBox}>
            <Text style={styles.alertTag}>PEMBERITAHUAN PERUBAHAN JADWAL</Text>
            <Text style={styles.alertText} numberOfLines={1}>
              Rapat Kerja Komisi II diundur menjadi pkl 10:00 WIB di R. Paripurna
            </Text>
          </View>
        </View>

        {/* INFO PANDUAN APLIKASI CARD - KHUSUS PIMPINAN ATAU UMUM */}
        <View style={[styles.infoAppCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <View style={styles.infoAppHeader}>
            <View style={[styles.infoAppIconBg, activeUser?.role === 'pimpinan' && { backgroundColor: '#FEF3C7' }]}>
              <MaterialIcons 
                name={activeUser?.role === 'pimpinan' ? 'shield' : 'info-outline'} 
                size={22} 
                color={activeUser?.role === 'pimpinan' ? '#D97706' : PRIMARY.blue} 
              />
            </View>
            <View style={styles.infoAppTitleBox}>
              <Text style={[styles.infoAppTitle, { color: theme.text }]}>
                {activeUser?.role === 'pimpinan' ? 'Mode Pimpinan & Pengawasan' : 'Tentang Aplikasi SIM Komisi DPRD'}
              </Text>
              <Text style={[styles.infoAppSub, { color: theme.textSecondary }]}>
                {activeUser?.role === 'pimpinan' ? 'Akses Eksekutif & Monitoring Lintas Komisi' : 'Panduan ringkas penggunaan sistem informasi'}
              </Text>
            </View>
          </View>
          <Text style={[styles.infoAppDesc, { color: theme.textSecondary }]}>
            {activeUser?.role === 'pimpinan' 
              ? 'Sebagai Pimpinan DPRD, Anda memiliki hak akses pemantauan menyeluruh terhadap agenda sidang, kuorum presensi dewan, serta validasi laporan dan risalah rapat seluruh komisi.'
              : 'Aplikasi ini digunakan untuk digitalisasi agenda rapat, absensi berbasis QR Code, pencatatan notulen, serta pengarsipan berkas fisik (Komisi I s.d. V DPRD).'}
          </Text>

          <View style={styles.guideGrid}>
            {activeUser?.role === 'pimpinan' ? (
              <>
                <View style={styles.guideItem}>
                  <MaterialIcons name="visibility" size={16} color="#D97706" />
                  <Text style={[styles.guideText, { color: theme.text }]}>1. Monitor Seluruh Komisi</Text>
                </View>
                <View style={styles.guideItem}>
                  <MaterialIcons name="how-to-reg" size={16} color="#10B981" />
                  <Text style={[styles.guideText, { color: theme.text }]}>2. Pantau Kuorum Sidang</Text>
                </View>
                <View style={styles.guideItem}>
                  <MaterialIcons name="verified" size={16} color="#2563EB" />
                  <Text style={[styles.guideText, { color: theme.text }]}>3. Review Berkas & Notulen</Text>
                </View>
                <View style={styles.guideItem}>
                  <MaterialIcons name="analytics" size={16} color="#9333EA" />
                  <Text style={[styles.guideText, { color: theme.text }]}>4. Rekapitulasi Kinerja</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.guideItem}>
                  <MaterialIcons name="event-note" size={16} color={PRIMARY.blue} />
                  <Text style={[styles.guideText, { color: theme.text }]}>1. Cek Jadwal & Perubahan</Text>
                </View>
                <View style={styles.guideItem}>
                  <MaterialIcons name="qr-code-scanner" size={16} color="#10B981" />
                  <Text style={[styles.guideText, { color: theme.text }]}>2. Presensi Absensi QR</Text>
                </View>
                <View style={styles.guideItem}>
                  <MaterialIcons name="document-scanner" size={16} color="#D97706" />
                  <Text style={[styles.guideText, { color: theme.text }]}>3. Scan Berkas ke PDF</Text>
                </View>
                <View style={styles.guideItem}>
                  <MaterialIcons name="assessment" size={16} color="#9333EA" />
                  <Text style={[styles.guideText, { color: theme.text }]}>4. Export Laporan Resmi</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* STATISTIK OVERVIEW */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistik Realtime</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Ringkasan data internal</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          <StatCard
            title="Total Kegiatan"
            value={stats.totalKegiatan}
            icon="event-note"
            color="#2563EB"
            bgColor="#DBEAFE"
            onPress={() => router.push('/jadwal' as any)}
          />
          <StatCard
            title="Hari Ini"
            value={stats.jadwalHariIni}
            icon="today"
            color="#D97706"
            bgColor="#FEF3C7"
            onPress={() => router.push('/jadwal' as any)}
          />
          <StatCard
            title="Mendatang"
            value={stats.jadwalMendatang}
            icon="update"
            color="#9333EA"
            bgColor="#F3E8FF"
            onPress={() => router.push('/jadwal' as any)}
          />
          <StatCard
            title="Arsip Digital"
            value={stats.totalArsip}
            icon="folder"
            color="#10B981"
            bgColor="#D1FAE5"
            onPress={() => router.push('/arsip' as any)}
          />
        </ScrollView>

        {/* REKAP PRESENSI CARD */}
        <View style={[styles.presensiCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <View style={styles.presensiTop}>
            <View>
              <Text style={[styles.presensiTitle, { color: theme.text }]}>Presensi Kehadiran</Text>
              <Text style={[styles.presensiSub, { color: theme.textSecondary }]}>Rekapitulasi hari ini</Text>
            </View>
            <TouchableOpacity style={styles.rekapPill} onPress={() => router.push('/menu' as any)}>
              <Text style={styles.rekapPillText}>Detail QR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presensiMetrics}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#10B981' }]}>{stats.hadirCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Hadir</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: '#EF4444' }]}>{stats.tidakHadirCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Izin / Absen</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: PRIMARY.blue }]}>{persentaseKehadiran}%</Text>
              <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Kehadiran</Text>
            </View>
          </View>
        </View>

        {/* AGENDA HARI INI */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Agenda Kegiatan Hari Ini</Text>
          <TouchableOpacity onPress={() => router.push('/jadwal' as any)}>
            <Text style={styles.linkText}>Lihat Kalender</Text>
          </TouchableOpacity>
        </View>

        {todaySchedule.length === 0 ? (
          <EmptyState
            icon="event-available"
            title="Tidak ada agenda rapat hari ini"
            message="Seluruh kegiatan yang akan datang dapat diperiksa di menu Jadwal."
          />
        ) : (
          todaySchedule.map((item) => (
            <ScheduleCard key={item.id} item={item} onPress={() => router.push('/jadwal' as any)} />
          ))
        )}

        {/* KOMISI I - V QUICK CHIPS */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.md }]}>
          Modul Komisi I – V
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.komisiChipsRow}>
          {DAFTAR_KOMISI.map((komisi) => {
            const kStyle = KOMISI_COLORS[komisi.nama as keyof typeof KOMISI_COLORS] || {};
            return (
              <TouchableOpacity
                key={komisi.id}
                style={[
                  styles.komisiPill,
                  { backgroundColor: theme.surface, borderColor: kStyle.border || theme.border },
                  Shadows.sm,
                ]}
                onPress={() => router.push('/komisi' as any)}
              >
                <View style={[styles.komisiIconDot, { backgroundColor: kStyle.accent || PRIMARY.blue }]} />
                <Text style={[styles.komisiPillText, { color: theme.text }]}>{komisi.nama}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* DOKUMEN ARSIP RECENT */}
        <View style={[styles.sectionHeaderRow, { marginTop: Spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Arsip Dokumen Terbaru</Text>
          <TouchableOpacity onPress={() => router.push('/arsip' as any)}>
            <Text style={styles.linkText}>Buka Arsip</Text>
          </TouchableOpacity>
        </View>

        {recentDocs.map((doc) => (
          <DocumentCard key={doc.id} item={doc} onPress={() => router.push('/arsip' as any)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroHeader: {
    backgroundColor: PRIMARY.navy,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgeGov: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeGovText: {
    fontSize: 10,
    fontWeight: '800',
    color: PRIMARY.gold,
    letterSpacing: 0.5,
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: Radius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: FontSizes.sm,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  heroScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  heroScanIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: PRIMARY.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScanTextContainer: {
    flex: 1,
  },
  heroScanTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#FFF',
  },
  heroScanSub: {
    fontSize: FontSizes.xs,
    color: '#CBD5E1',
    marginTop: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextBox: {
    flex: 1,
  },
  alertTag: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY.blue,
    letterSpacing: 0.5,
  },
  alertText: {
    fontSize: FontSizes.xs,
    color: '#1E40AF',
    fontWeight: '600',
    marginTop: 1,
  },
  sectionHeader: {
    marginTop: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: FontSizes.xs,
    marginTop: 1,
  },
  linkText: {
    fontSize: FontSizes.xs,
    color: PRIMARY.blue,
    fontWeight: '700',
  },
  statsRow: {
    gap: Spacing.md,
    paddingRight: Spacing.base,
  },
  presensiCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  presensiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  presensiTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
  },
  presensiSub: {
    fontSize: FontSizes.xs,
    marginTop: 1,
  },
  rekapPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  rekapPillText: {
    fontSize: FontSizes.xs,
    color: PRIMARY.blue,
    fontWeight: '700',
  },
  presensiMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: FontSizes.xs,
    marginTop: 2,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  komisiChipsRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.base,
  },
  komisiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  komisiPillText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  komisiIconDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  userBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: 4,
    marginBottom: 4,
  },
  userBannerPimpinan: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderWidth: 1,
  },
  pimpinanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pimpinanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
    textTransform: 'uppercase',
  },
  userBannerTitle: {
    color: '#FFF',
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  userBannerSub: {
    color: PRIMARY.gold,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  infoAppCard: {
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoAppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoAppIconBg: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoAppTitleBox: {
    flex: 1,
  },
  infoAppTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
  },
  infoAppSub: {
    fontSize: 10,
    marginTop: 1,
  },
  infoAppDesc: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  guideGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  guideText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
