import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { bookingAPI, qpayAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

function money(n: number) { return n.toLocaleString() + '₮'; }
function genId() { return 'TK-' + Date.now().toString(36).toUpperCase().slice(-5); }

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    movieId:string; movieTitle:string; posterUrl:string;
    date:string; time:string; scheduleId:string;
    seats:string; totalPrice:string;
  }>();

  const seats      = JSON.parse(params.seats || '[]');
  const totalPrice = parseInt(params.totalPrice || '0', 10);

  const [name,    setName]    = useState(user?.name  || '');
  const [email,   setEmail]   = useState(user?.email || '');
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  // QPay state
  const [qpayStep,  setQpayStep]  = useState<'idle'|'loading'|'qr'|'success'|'error'>('idle');
  const [invoiceId, setInvoiceId] = useState('');
  const [qrCode,    setQrCode]    = useState('');
  const [bankUrls,  setBankUrls]  = useState<any[]>([]);
  const [errMsg,    setErrMsg]    = useState('');
  const [timeLeft,  setTimeLeft]  = useState(180);
  const [bookingId, setBookingId] = useState('');
  const pollRef  = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const paidRef  = useRef(false);

  const cleanup = () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  };

  useEffect(() => () => cleanup(), []);

  const handlePay = async () => {
    if (!name || !email || !phone) { Alert.alert('Анхааруулга', 'Бүх талбарыг бөглөнө үү'); return; }
    setLoading(true);
    try {
      let bId = genId();
      try {
        const res = await bookingAPI.create({
          scheduleId: params.scheduleId,
          movieId:    params.movieId,
          movieTitle: params.movieTitle,
          date:       params.date,
          time:       params.time,
          seats:      seats.map((s: any) => ({ seatId: s.id, type: s.type })),
          totalPrice,
          customer:   { name, email, phone },
          status:     'pending',
        });
        bId = res.bookingId || res.booking?._id || res._id || bId;
      } catch {}
      setBookingId(bId);
      await initQPay(bId);
    } finally {
      setLoading(false);
    }
  };

  const initQPay = async (bId: string) => {
    paidRef.current = false;
    setQpayStep('loading');
    setTimeLeft(180);
    try {
      const res = await qpayAPI.createInvoice({
        bookingId:  String(bId),
        amount:     totalPrice,
        seats:      seats.map((s: any) => s.id),
        movieTitle: params.movieTitle,
      });
      if (res.success) {
        setInvoiceId(res.data.invoiceId);
        setQrCode(res.data.qrCode || '');
        setBankUrls(res.data.urls || []);
        setQpayStep('qr');
        startPoll(res.data.invoiceId, bId);
        startTimer();
      } else throw new Error('Invoice үүсгэхэд алдаа');
    } catch (e: any) {
      setErrMsg(e.message || 'QPay холболтын алдаа');
      setQpayStep('error');
    }
  };

  const startPoll = (id: string, bId: string) => {
    pollRef.current = setInterval(async () => {
      if (paidRef.current) return;
      try {
        const res = await qpayAPI.checkPayment(id);
        if (res.success && res.data?.paid) {
          paidRef.current = true;
          cleanup();
          await qpayAPI.confirmBooking(bId);
          setQpayStep('success');
          setTimeout(() => {
            router.replace({
              pathname: '/booking/ticket',
              params: {
                orderId:       bookingId || id,
                movieTitle:    params.movieTitle,
                posterUrl:     params.posterUrl,
                date:          params.date,
                time:          params.time,
                seats:         params.seats,
                totalPrice:    params.totalPrice,
                customerName:  name,
                customerEmail: email,
              },
            });
          }, 1500);
        }
      } catch {}
    }, 3000);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          cleanup();
          setQpayStep('error');
          setErrMsg('Төлбөрийн хугацаа дууслаа');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // ── QPay Modal ────────────────────────────────────────────────────────────
  if (qpayStep !== 'idle') {
    return (
      <View style={styles.qpayContainer}>
        <LinearGradient colors={['#0a0a0f','#12121e']} style={StyleSheet.absoluteFill} />

        <View style={styles.qpayCard}>
          {/* Header */}
          <LinearGradient colors={[COLORS.teal, '#13c4a3']} style={styles.qpayHeader}>
            <View>
              <Text style={styles.qpayHeaderTitle}>QPay төлбөр</Text>
              <Text style={styles.qpayHeaderSub}>{params.movieTitle}</Text>
            </View>
            {qpayStep !== 'success' && (
              <TouchableOpacity
                onPress={async () => {
                  cleanup();
                  if (invoiceId) {
                    try { await qpayAPI.cancelInvoice(invoiceId); } catch {}
                  }
                  if (bookingId) {
                    try { await qpayAPI.cancelBooking(bookingId); } catch {}
                  }
                  setQpayStep('idle');
                }}
                style={styles.qpayClose}
              >
                <Text style={{ color:'#0f261c', fontWeight:'800', fontSize:16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>

          <View style={styles.qpayBody}>
            {/* Amount */}
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Төлбөрийн дүн</Text>
              <Text style={styles.amountValue}>{money(totalPrice)}</Text>
            </View>

            {qpayStep === 'loading' && (
              <>
                <ActivityIndicator color={COLORS.teal} size="large" />
                <Text style={styles.qpayHint}>QR код бэлдэж байна…</Text>
              </>
            )}

            {qpayStep === 'qr' && (
              <>
                <View style={styles.qrWrap}>
                  <Image
                    source={{ uri: qrCode
                      ? `data:image/png;base64,${qrCode}`
                      : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invoiceId)}`
                    }}
                    style={styles.qrImage}
                  />
                </View>

                <Text style={[styles.timer, { color: timeLeft < 30 ? COLORS.coral : COLORS.teal }]}>
                  ⏱ {fmt(timeLeft)} дотор төлнө үү
                </Text>

                {bankUrls.length > 0 && (
                  <>
                    <Text style={styles.qpayHint}>Эсвэл банкаа сонгоно уу:</Text>
                    <View style={styles.banksGrid}>
                      {bankUrls.slice(0, 6).map((u: any, i: number) => (
                        <TouchableOpacity key={i} style={styles.bankBtn}>
                          <Text style={styles.bankText}>{u?.name || `Банк ${i+1}`}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.qpayHint}>Банкны аппаараа QR уншуулна уу</Text>
              </>
            )}

            {qpayStep === 'success' && (
              <>
                <View style={[styles.resultIcon, { backgroundColor:'rgba(29,233,182,0.12)', borderColor: COLORS.teal }]}>
                  <Text style={{ fontSize:32 }}>✓</Text>
                </View>
                <Text style={[styles.resultTitle, { color: COLORS.teal }]}>Төлбөр амжилттай!</Text>
                <Text style={styles.qpayHint}>Тасалбар бэлдэж байна…</Text>
                <ActivityIndicator color={COLORS.teal} style={{ marginTop: SPACING.md }} />
              </>
            )}

            {qpayStep === 'error' && (
              <>
                <View style={[styles.resultIcon, { backgroundColor:'rgba(232,96,122,0.12)', borderColor: COLORS.coral }]}>
                  <Text style={{ fontSize:32 }}>✕</Text>
                </View>
                <Text style={[styles.resultTitle, { color: COLORS.coral }]}>Алдаа гарлаа</Text>
                <Text style={styles.qpayHint}>{errMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => initQPay(bookingId)}>
                  <Text style={styles.retryText}>Дахин оролдох</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Захиалга баталгаажуулах</Text>
          <View style={{ width:38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Order summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Захиалгын тойм</Text>
            {[
              ['Кино',     params.movieTitle],
              ['Огноо',    params.date],
              ['Цаг',      params.time],
              ['Суудлууд', seats.map((s: any) => s.id).join(', ')],
              ['Том хүн',  seats.filter((s:any)=>s.type==='adult').length + ' ширхэг'],
              ['Хүүхэд',   seats.filter((s:any)=>s.type==='child').length > 0
                ? seats.filter((s:any)=>s.type==='child').length + ' ширхэг' : null],
            ].filter(([,v]) => v).map(([k,v]) => (
              <View key={k as string} style={styles.row}>
                <Text style={styles.rowKey}>{k}</Text>
                <Text style={styles.rowVal}>{v}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Нийт дүн</Text>
              <Text style={styles.totalVal}>{money(totalPrice)}</Text>
            </View>
          </View>

          {/* Customer info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Хувийн мэдээлэл</Text>
            {[
              { label:'НЭР',   value:name,  set:setName,  placeholder:'Таны нэр', type:'default' },
              { label:'ИМЭЙЛ', value:email, set:setEmail, placeholder:'name@example.com', type:'email-address' },
              { label:'УТАС',  value:phone, set:setPhone, placeholder:'9911xxxx', type:'phone-pad' },
            ].map(f => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textSub}
                  keyboardType={f.type as any}
                  autoCapitalize="none"
                />
              </View>
            ))}
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>⚠ Анхааруулга</Text>
            <Text style={styles.warningText}>• Кино, огноо, цагаа сайтар шалгана уу.</Text>
            <Text style={styles.warningText}>• Төлбөр төлсний дараа тасалбар буцаах боломжгүй.</Text>
            <Text style={styles.warningText}>• Цаг эхлэхээс 10 минутын өмнө ирнэ үү.</Text>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payBtn, loading && { opacity:0.6 }]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[COLORS.teal, '#13c4a3']} style={styles.payGrad}>
              {loading
                ? <ActivityIndicator color="#0f261c" />
                : <Text style={styles.payText}>QPay-р төлөх · {money(totalPrice)}</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor: COLORS.bg },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal: SPACING.lg, paddingTop:60, paddingBottom: SPACING.md },
  backBtn:      { width:38, height:38, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: COLORS.border },
  backText:     { color: COLORS.white, fontSize:18, fontWeight:'700' },
  headerTitle:  { color: COLORS.white, fontSize:16, fontWeight:'700' },
  scroll:       { padding: SPACING.lg },
  card:         { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth:1, borderColor: COLORS.border, marginBottom: SPACING.md },
  cardTitle:    { color: COLORS.white, fontSize:16, fontWeight:'700', marginBottom: SPACING.md },
  row:          { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor: COLORS.border },
  rowKey:       { color: COLORS.textSub, fontSize:13 },
  rowVal:       { color: COLORS.white, fontSize:13, fontWeight:'600', maxWidth:'60%', textAlign:'right' },
  totalRow:     { flexDirection:'row', justifyContent:'space-between', paddingTop: SPACING.md, marginTop: SPACING.sm },
  totalKey:     { color: COLORS.white, fontSize:15, fontWeight:'700' },
  totalVal:     { color: COLORS.teal, fontSize:18, fontWeight:'800' },
  field:        { marginBottom: SPACING.md },
  fieldLabel:   { fontSize:10, fontWeight:'700', letterSpacing:1.5, color: COLORS.textSub, marginBottom:6 },
  input:        { backgroundColor: COLORS.bgElevate, borderRadius: RADIUS.sm, padding: SPACING.md, color: COLORS.text, fontSize:15, borderWidth:1, borderColor: COLORS.border },
  warning:      { backgroundColor:'rgba(255,179,71,0.05)', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth:1, borderColor:'rgba(255,179,71,0.2)' },
  warningTitle: { color:'#ffb347', fontWeight:'700', fontSize:13, marginBottom: SPACING.sm },
  warningText:  { color:'rgba(255,179,71,0.7)', fontSize:12, lineHeight:20 },
  footer:       { position:'absolute', bottom:0, left:0, right:0, padding: SPACING.lg, backgroundColor: COLORS.bg, borderTopWidth:1, borderTopColor: COLORS.border },
  payBtn:       { borderRadius: RADIUS.md, overflow:'hidden' },
  payGrad:      { padding: SPACING.md + 2, alignItems:'center' },
  payText:      { color:'#0f261c', fontWeight:'800', fontSize:16 },
  // QPay
  qpayContainer:{ flex:1, alignItems:'center', justifyContent:'center', padding: SPACING.lg },
  qpayCard:     { width:'100%', maxWidth:360, borderRadius: RADIUS.lg, overflow:'hidden', backgroundColor: COLORS.bgCard, borderWidth:1, borderColor: COLORS.border2 },
  qpayHeader:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: SPACING.md },
  qpayHeaderTitle:{ color:'#0f261c', fontWeight:'800', fontSize:15 },
  qpayHeaderSub:  { color:'rgba(15,38,28,0.65)', fontSize:11, marginTop:2 },
  qpayClose:    { width:32, height:32, borderRadius: RADIUS.full, backgroundColor:'rgba(0,0,0,0.15)', alignItems:'center', justifyContent:'center' },
  qpayBody:     { padding: SPACING.lg, alignItems:'center', gap: SPACING.md },
  amountBox:    { backgroundColor:'rgba(29,233,182,0.08)', borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, alignItems:'center', borderWidth:1, borderColor:'rgba(29,233,182,0.2)', width:'100%' },
  amountLabel:  { color: COLORS.textSub, fontSize:11, marginBottom:4 },
  amountValue:  { color: COLORS.teal, fontSize:28, fontWeight:'800' },
  qrWrap:       { padding:8, backgroundColor:'#fff', borderRadius: RADIUS.md, borderWidth:3, borderColor: COLORS.teal },
  qrImage:      { width:200, height:200 },
  timer:        { fontSize:15, fontWeight:'700' },
  banksGrid:    { flexDirection:'row', flexWrap:'wrap', gap:6, justifyContent:'center' },
  bankBtn:      { paddingHorizontal: SPACING.sm, paddingVertical:6, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevate, borderWidth:1, borderColor: COLORS.border },
  bankText:     { color: COLORS.textDim, fontSize:11 },
  qpayHint:     { color: COLORS.textSub, fontSize:12, textAlign:'center' },
  resultIcon:   { width:72, height:72, borderRadius: RADIUS.full, alignItems:'center', justifyContent:'center', borderWidth:2 },
  resultTitle:  { fontSize:20, fontWeight:'800' },
  retryBtn:     { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: COLORS.teal, borderRadius: RADIUS.md },
  retryText:    { color:'#0f261c', fontWeight:'700' },
});
