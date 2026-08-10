import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Colors, PRIMARY, Spacing, Radius, FontSizes, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ScheduleCard from '@/components/ScheduleCard';
import EmptyState from '@/components/EmptyState';
import { jadwalStorage } from '@/utils/storage';
import { DAFTAR_KOMISI } from '@/constants/data';

export default function ScheduleScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedKomisi, setSelectedKomisi] = useState('Semua');
  const [schedules, setSchedules] = useState([]);
  const [markedDates, setMarkedDates] = useState({});

  const loadSchedules = async () => {
    const all = await jadwalStorage.getAll();

    const marks = {};
    all.forEach((item) => {
      marks[item.tanggal] = {
        marked: true,
        dotColor: PRIMARY.blue,
      };
    });

    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: PRIMARY.blue,
    };

    setMarkedDates(marks);

    let filtered = all.filter((item) => item.tanggal === selectedDate);
    if (selectedKomisi !== 'Semua') {
      filtered = filtered.filter((item) => item.komisi === selectedKomisi);
    }
    setSchedules(filtered);
  };

  useEffect(() => {
    loadSchedules();
  }, [selectedDate, selectedKomisi]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER WITH ADD ACTION */}
      <View style={[styles.header, { backgroundColor: PRIMARY.navy }]}>
        <View>
          <Text style={styles.headerTitle}>Jadwal Kegiatan Komisi</Text>
          <Text style={styles.headerSub}>Penjadwalan & Agenda Rapat Komisi I–V</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/jadwal/add')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="add" size={20} color={PRIMARY.navy} />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* CALENDAR */}
        <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.md]}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              todayTextColor: PRIMARY.blue,
              arrowColor: PRIMARY.blue,
              monthTextColor: theme.text,
              textDayFontWeight: '600',
              textMonthFontWeight: '800',
              textDayHeaderFontWeight: '700',
            }}
          />
        </View>

        {/* FILTER KOMISI */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: theme.text }]}>Filter Komisi:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {['Semua', ...DAFTAR_KOMISI.map((k) => k.nama)].map((komisi) => (
              <TouchableOpacity
                key={komisi}
                style={[
                  styles.filterChip,
                  selectedKomisi === komisi && { backgroundColor: PRIMARY.blue },
                  selectedKomisi !== komisi && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setSelectedKomisi(komisi)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedKomisi === komisi ? '#FFF' : theme.textSecondary },
                  ]}
                >
                  {komisi}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AGENDA LIST WITH ACTION BUTTONS */}
        <View style={styles.listSection}>
          <Text style={[styles.dateTitle, { color: theme.text }]}>
            Agenda Tanggal {selectedDate}
          </Text>

          {schedules.length === 0 ? (
            <EmptyState
              icon="event-note"
              title="Tidak Ada Agenda"
              message={`Tidak ditemukan jadwal kegiatan untuk ${selectedKomisi} pada tanggal ini.`}
            />
          ) : (
            schedules.map((item) => (
              <View key={item.id} style={styles.scheduleWrapper}>
                <ScheduleCard item={item} />
                
                {/* ACTION BAR FOR EACH ITEM */}
                <View style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/absensi/qr',
                        params: { id: item.id, judul: item.judul, komisi: item.komisi },
                      })
                    }
                  >
                    <MaterialIcons name="qr-code-scanner" size={16} color={PRIMARY.blue} />
                    <Text style={[styles.actionText, { color: PRIMARY.blue }]}>QR Absensi</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/rapat/notulen',
                        params: { id: item.id, judul: item.judul, komisi: item.komisi },
                      })
                    }
                  >
                    <MaterialIcons name="description" size={16} color="#10B981" />
                    <Text style={[styles.actionText, { color: '#10B981' }]}>Input Notulen</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/jadwal/edit',
                        params: {
                          id: item.id,
                          judul: item.judul,
                          tanggal: item.tanggal,
                          waktuMulai: item.waktuMulai,
                          lokasi: item.lokasi,
                        },
                      })
                    }
                  >
                    <MaterialIcons name="edit" size={16} color="#F59E0B" />
                    <Text style={[styles.actionText, { color: '#F59E0B' }]}>Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PRIMARY.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.full,
  },
  addBtnText: {
    color: PRIMARY.navy,
    fontWeight: '800',
    fontSize: FontSizes.xs,
  },
  calendarCard: {
    margin: Spacing.base,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  filterSection: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  filterTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  filterRow: {
    gap: Spacing.xs,
    paddingRight: Spacing.base,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  listSection: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  dateTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  scheduleWrapper: {
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    marginTop: -Spacing.md + 4,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
});
