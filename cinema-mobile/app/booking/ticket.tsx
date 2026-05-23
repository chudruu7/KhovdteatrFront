import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

function money(n: number) { return n.toLocaleString() + '₮'; }

export default function TicketScreen() {
  const router = useRouter();
  const {
    orderId, movieTitle, date, time, seats,
    totalPrice, customerName, customerEmail,
  } = useLocalSearchParams<{
    orderId:string; movieTitle:string; date:string; time:string;
    seats:string; totalPrice:string; customerName:string; customerEmail:string;
  }>();

  const parsedSeats = JSON.parse(seats || '[]');
  const seatIds     = parsedSeats.map((s: any) => s.id).join(', ');
  const total       = parseInt(totalPrice || '0', 10);

  const handleShare = async () => {
    await Share.share({
      message: `🎬 ${movieTitle}\n📅 ${date} · ${time}\n💺 ${seatIds}\n🎫 ${orderId}`,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Success icon */}
        <View style={styles.successWrap}>
          <LinearGradient colors={[COLORS.teal, '#13c4a3']} style={styles.successRing}>
            <Text style={{ fontSize:36 }}>✓</Text>
          </LinearGradient>
          <Text style={styles.successTitle}>Захиалга амжилттай!</Text>
          <Text style={styles.successSub}>Таны тасалбар бэлэн боллоо</Text>
        </View>

        {/* Ticket card */}
        <View style={styles.ticket}>
          {/* Top */}
          <LinearGradient colors={['#1a1a28', '#13131a']} style={styles.ticketTop}>
            <Text style={styles.cinemaName}>ХОВД КИНО ТЕАТР</Text>
            <Text style={styles.movieName}>{movieTitle}</Text>
            <View style={styles.ticketMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>ОГНОО</Text>
                <Text style={styles.metaVal}>{date}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>ЦАГ</Text>
                <Text style={styles.metaVal}>{time}</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaKey}>СУУДАЛ</Text>
                <Text style={styles.metaVal} numberOfLines={2}>{seatIds}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Dashed divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerCircleLeft} />
            <View style={styles.dashedLine} />
            <View style={styles.dividerCircleRight} />
          </View>

          {/* Bottom */}
          <View style={styles.ticketBottom}>
            <View style={styles.bottomRow}>
              <View>
                <Text style={styles.metaKey}>ЗАХИАЛГЫН КОД</Text>
                <Text style={styles.orderId}>{orderId}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={styles.metaKey}>НИЙТ ДҮН</Text>
                <Text style={styles.totalAmt}>{money(total)}</Text>
              </View>
            </View>
            {customerName && (
              <View style={{ marginTop: SPACING.sm }}>
                <Text style={styles.metaKey}>НЭР</Text>
                <Text style={styles.metaVal}>{customerName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btns}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>📤  Хуваалцах</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[COLORS.teal, '#13c4a3']} style={styles.homeBtnGrad}>
              <Text style={styles.homeBtnText}>🏠  Нүүр хуудас руу</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor: COLORS.bg },
  scroll:       { padding: SPACING.lg, paddingTop:80, alignItems:'center' },
  successWrap:  { alignItems:'center', marginBottom: SPACING.xl },
  successRing:  { width:88, height:88, borderRadius: RADIUS.full, alignItems:'center', justifyContent:'center', marginBottom: SPACING.md, shadowColor: COLORS.teal, shadowOpacity:0.5, shadowRadius:20 },
  successTitle: { fontSize:26, fontWeight:'800', color: COLORS.white, marginBottom:6 },
  successSub:   { color: COLORS.textSub, fontSize:14 },
  ticket:       { width:'100%', borderRadius: RADIUS.lg, overflow:'hidden', borderWidth:1, borderColor: COLORS.border2, marginBottom: SPACING.lg },
  ticketTop:    { padding: SPACING.lg },
  cinemaName:   { fontSize:11, fontWeight:'700', letterSpacing:3, color: COLORS.teal, textTransform:'uppercase', marginBottom: SPACING.sm },
  movieName:    { fontSize:22, fontWeight:'800', color: COLORS.white, marginBottom: SPACING.lg },
  ticketMeta:   { flexDirection:'row', gap: SPACING.sm },
  metaItem:     { flex:1 },
  metaDivider:  { width:1, backgroundColor: COLORS.border },
  metaKey:      { fontSize:9, fontWeight:'700', letterSpacing:1.5, color: COLORS.textSub, marginBottom:4, textTransform:'uppercase' },
  metaVal:      { color: COLORS.white, fontWeight:'600', fontSize:13 },
  dividerRow:   { flexDirection:'row', alignItems:'center', backgroundColor: COLORS.bgCard },
  dividerCircleLeft:  { width:20, height:20, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, marginLeft:-10 },
  dividerCircleRight: { width:20, height:20, borderRadius: RADIUS.full, backgroundColor: COLORS.bg, marginRight:-10 },
  dashedLine:   { flex:1, borderTopWidth:2, borderTopColor: COLORS.border, borderStyle:'dashed' },
  ticketBottom: { backgroundColor: COLORS.bgCard, padding: SPACING.lg },
  bottomRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  orderId:      { fontSize:22, fontWeight:'800', color: COLORS.teal, letterSpacing:2, fontVariant:['tabular-nums'] },
  totalAmt:     { fontSize:18, fontWeight:'800', color: COLORS.white },
  btns:         { width:'100%', gap: SPACING.sm },
  shareBtn:     { padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.bgCard, alignItems:'center', borderWidth:1, borderColor: COLORS.border },
  shareBtnText: { color: COLORS.textDim, fontWeight:'600', fontSize:15 },
  homeBtn:      { borderRadius: RADIUS.md, overflow:'hidden' },
  homeBtnGrad:  { padding: SPACING.md + 2, alignItems:'center' },
  homeBtnText:  { color:'#0f261c', fontWeight:'800', fontSize:16 },
});
