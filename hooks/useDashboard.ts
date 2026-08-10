import { useState, useEffect, useCallback } from 'react';
import { jadwalStorage, arsipStorage, seedMockData } from '@/utils/storage';

export interface DashboardStats {
    totalKegiatan: number;
    jadwalHariIni: number;
    jadwalMendatang: number;
    totalArsip: number;
    hadirCount: number;
    tidakHadirCount: number;
}

export const useDashboard = () => {
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalKegiatan: 0,
        jadwalHariIni: 0,
        jadwalMendatang: 0,
        totalArsip: 0,
        hadirCount: 22, // TODO: Ganti dengan data dinamis
        tidakHadirCount: 3, // TODO: Ganti dengan data dinamis
    });

    const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
    const [recentDocs, setRecentDocs] = useState<any[]>([]);

    const loadDashboardData = useCallback(async () => {
        await seedMockData(); // Sebaiknya hanya untuk development
        const allJadwal = await jadwalStorage.getAll();
        const allArsip = await arsipStorage.getAll();

        const todayStr = new Date().toISOString().split('T')[0];
        const todayItems = allJadwal.filter((j: any) => j.tanggal === todayStr);
        const upcomingItems = allJadwal.filter((j: any) => j.tanggal > todayStr);

        setTodaySchedule(todayItems);
        setRecentDocs(allArsip.slice(0, 3));

        setStats((prev) => ({ ...prev, totalKegiatan: allJadwal.length, jadwalHariIni: todayItems.length, jadwalMendatang: upcomingItems.length, totalArsip: allArsip.length }));
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    }, [loadDashboardData]);

    return { stats, todaySchedule, recentDocs, refreshing, onRefresh };
};