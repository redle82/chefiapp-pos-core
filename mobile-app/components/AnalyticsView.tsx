import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { supabase } from '@/services/supabase';

const screenWidth = Dimensions.get("window").width;

interface AnalyticsViewProps {
    shiftId?: string | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ shiftId }) => {
    const [loading, setLoading] = useState(true);
    const [salesTrend, setSalesTrend] = useState<number[]>(new Array(7).fill(0));
    const [salesLabels, setSalesLabels] = useState<string[]>([]);
    const [topProducts, setTopProducts] = useState<{ name: string, count: number }[]>([]);
    const [paymentMix, setPaymentMix] = useState<{ name: string, population: number, color: string, legendFontColor: string, legendFontSize: number }[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, [shiftId]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Initialize labels anyway
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const labels = new Array(7).fill('');
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                labels[i] = days[d.getDay()];
            }
            setSalesLabels(labels);

            // 1. Sales Trend (Last 7 Days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const { data: trendData } = await supabase
                .from('gm_orders')
                .select('total_amount, created_at')
                .gte('created_at', sevenDaysAgo.toISOString())
                .neq('status', 'cancelled');

            if (trendData && trendData.length > 0) {
                const chartData = new Array(7).fill(0);

                trendData.forEach(o => {
                    const orderDate = new Date(o.created_at);
                    orderDate.setHours(0, 0, 0, 0);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const diffTime = today.getTime() - orderDate.getTime();
                    const dayDiff = Math.floor(diffTime / (1000 * 3600 * 24));

                    if (dayDiff >= 0 && dayDiff < 7) {
                        chartData[6 - dayDiff] += (o.total_amount / 100);
                    }
                });

                setSalesTrend(chartData);
            } else {
                // Keep default zeros
                setSalesTrend(new Array(7).fill(0));
            }

            // 2. Top Products
            const { data: itemData } = await supabase
                .from('gm_order_items')
                .select('product_name, quantity')
                .order('created_at', { ascending: false })
                .limit(200);

            if (itemData) {
                const counts: Record<string, number> = {};
                itemData.forEach(i => {
                    counts[i.product_name] = (counts[i.product_name] || 0) + (i.quantity || 1);
                });

                const sorted = Object.entries(counts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([name, count]) => ({ name, count }));

                setTopProducts(sorted);
            }

            // 3. Payment Mix
            const { data: mixData } = await supabase
                .from('gm_order_items')
                .select('category_name, total_price')
                .limit(200);

            if (mixData) {
                let food = 0;
                let drink = 0;
                mixData.forEach(i => {
                    const price = (i.total_price || 0) / 100;
                    if (i.category_name === 'drink') drink += price;
                    else food += price;
                });

                // Prevent empty chart crash for Pie too
                if (food === 0 && drink === 0) {
                    setPaymentMix([
                        { name: 'Sem Dados', population: 1, color: '#444', legendFontColor: '#7F7F7F', legendFontSize: 12 }
                    ]);
                } else {
                    setPaymentMix([
                        { name: 'Comida', population: food, color: '#FF9500', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                        { name: 'Bebida', population: drink, color: '#0A84FF', legendFontColor: '#7F7F7F', legendFontSize: 12 }
                    ]);
                }
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color="#32d74b" />;

    return (
        <View style={styles.container}>
            <Text style={styles.chartTitle}>Vendas (7 Dias)</Text>
            <LineChart
                data={{
                    labels: salesLabels.length > 0 ? salesLabels : ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                    datasets: [{
                        data: salesTrend.length > 0 ? salesTrend : [0, 0, 0, 0, 0, 0, 0]
                    }]
                }}
                width={screenWidth - 32}
                height={220}
                yAxisLabel="€"
                fromZero
                chartConfig={{
                    backgroundColor: "#1c1c1e",
                    backgroundGradientFrom: "#1c1c1e",
                    backgroundGradientTo: "#1c1c1e",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(50, 215, 75, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: "4", strokeWidth: "2", stroke: "#32d74b" }
                }}
                bezier
                style={styles.chart}
            />

            <Text style={styles.chartTitle}>Top 5 Produtos</Text>
            {topProducts.length > 0 ? (
                <BarChart
                    data={{
                        labels: topProducts.map(p => p.name.length > 10 ? p.name.substring(0, 8) + '..' : p.name),
                        datasets: [{ data: topProducts.map(p => p.count) }]
                    }}
                    width={screenWidth - 32}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                        backgroundColor: "#1c1c1e",
                        backgroundGradientFrom: "#1c1c1e",
                        backgroundGradientTo: "#1c1c1e",
                        color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        barPercentage: 0.7,
                    }}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                />
            ) : (
                <View style={[styles.chart, styles.emptyChart]}>
                    <Text style={styles.emptyText}>Sem dados de produtos</Text>
                </View>
            )}

            <Text style={styles.chartTitle}>Mix de Vendas (Valor)</Text>
            {paymentMix.length > 0 ? (
                <PieChart
                    data={paymentMix}
                    width={screenWidth - 32}
                    height={220}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute={false}
                />
            ) : (
                <View style={[styles.chart, styles.emptyChart]}>
                    <Text style={styles.emptyText}>Sem dados de vendas</Text>
                </View>
            )}
            <View style={{ height: 50 }} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    chartTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        marginTop: 10
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
        paddingRight: 40 // Fix clipper labels
    },
    emptyChart: {
        height: 100,
        backgroundColor: '#1c1c1e',
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#444'
    },
    emptyText: {
        color: '#888',
        fontSize: 14
    }
});
