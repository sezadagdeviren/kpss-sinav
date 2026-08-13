import React, { useState, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DrawingCanvas from '../components/DrawingCanvas';
import { PinchGestureHandler, PanGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import { useQuiz } from '../hooks/useQuiz';
import { useTimer } from '../hooks/useTimer';

// Components
import { QuizHeader } from '../components/quiz/QuizHeader';
import { QuizAnswerPanel } from '../components/quiz/QuizAnswerPanel';
import { QuestionGrid } from '../components/quiz/QuestionGrid';

const { width, height: screenHeight } = Dimensions.get('window');

export default function QuizView({ route, navigation }: any) {
  const { category, year, sinavTuru } = route.params;

  const {
    questions, currentIdx, currentQuestion, loading, selectedAnswer,
    handleAnswer, toggleFavorite, nextQuestion, prevQuestion, jumpToQuestion,
    loadQuestions, setCurrentIdx,
  } = useQuiz({ category, year, sinavTuru });

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isExamFinished, setIsExamFinished] = useState(false);
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<{ [id: number]: number }>({});
  const [isPinching, setIsPinching] = useState(false);

  // Pinch ve Pan jest handler ref'leri (simultaneousHandlers için gerekli)
  const pinchRef = React.useRef(null);
  const panRef = React.useRef(null);

  // İki parmakla yakınlaştırma (Zoom) için kalıcı animasyon değerleri
  const baseScale = React.useRef(new Animated.Value(1)).current;
  const pinchScale = React.useRef(new Animated.Value(1)).current;
  const scale = React.useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastScale = React.useRef(1);

  // Sürükleme (Pan) için animasyon değerleri
  const translateX = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const lastTranslateX = React.useRef(0);
  const lastTranslateY = React.useRef(0);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN || event.nativeEvent.state === State.ACTIVE) {
      setIsPinching(true);
    }
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED || event.nativeEvent.state === State.FAILED) {
      setIsPinching(false);
      let nextScale = lastScale.current * event.nativeEvent.scale;
      if (nextScale < 1) nextScale = 1;
      if (nextScale > 5) nextScale = 5;
      lastScale.current = nextScale;
      baseScale.setValue(nextScale);
      pinchScale.setValue(1);
    }
  };

  const onPanStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
      // Son konumu birikimli olarak kaydet
      lastTranslateX.current += event.nativeEvent.translationX;
      lastTranslateY.current += event.nativeEvent.translationY;
      translateX.setOffset(lastTranslateX.current);
      translateX.setValue(0);
      translateY.setOffset(lastTranslateY.current);
      translateY.setValue(0);
    }
  };

  // Yakınlaştırma + konumu sıfırla (Çift tıklama ile)
  const handleResetZoom = () => {
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    Animated.parallel([
      Animated.timing(baseScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    pinchScale.setValue(1);
    translateX.setOffset(0);
    translateY.setOffset(0);
  };
  
  const storageKey = `kpss_q_times_${sinavTuru}_${category}_${year}`;
  const submittedKey = `kpss_exam_submitted_${sinavTuru}_${category}_${year}`;

  // AsyncStorage'dan süreleri ve submitted durumunu yükleme
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [savedTimes, savedSub] = await Promise.all([
          AsyncStorage.getItem(storageKey),
          AsyncStorage.getItem(submittedKey)
        ]);
        if (isMounted) {
          if (savedTimes) setQuestionTimes(JSON.parse(savedTimes));
          if (savedSub === 'true') setIsExamSubmitted(true);
        }
      } catch (e) {
        console.error("Failed to load question state from storage", e);
      }
    })();
    return () => { isMounted = false; };
  }, [category, year, sinavTuru, storageKey, submittedKey]);

  // Sınav bitirilmiş mi veya submitted edilmiş mi?
  const isExamCompletedBefore = useMemo(() => {
    return isExamSubmitted;
  }, [isExamSubmitted]);

  const isFinished = isExamFinished || isExamCompletedBefore;

  const { timer, setIsActive, resetTimer } = useTimer(!isFinished);

  const stats = useMemo(() => {
    const s = { correct: 0, wrong: 0, empty: 0 };
    questions.forEach(q => {
      if (q.status === 'correct') s.correct++;
      else if (q.status === 'wrong') s.wrong++;
      else s.empty++;
    });
    return s;
  }, [questions]);

  const handleFinish = async () => {
    setIsActive(false);
    setIsExamFinished(true);
    setIsExamSubmitted(true);

    try {
      await Promise.all([
        AsyncStorage.setItem(storageKey, JSON.stringify(questionTimes)),
        AsyncStorage.setItem(submittedKey, 'true')
      ]);
    } catch (e) {}

    try {
      await api.saveExamSummary({
        kategori: category,
        yil: year,
        sinav_turu: sinavTuru,
        last_time: timer,
        last_correct: stats.correct,
        last_wrong: stats.wrong,
        last_empty: stats.empty
      });
      Alert.alert('Sınav Kaydedildi', 'Sonucunuz başarıyla kaydedildi.');
      navigation.goBack();
    } catch (err) {
      console.error('❌ Kayıt hatası:', err);
      Alert.alert('Hata', 'Sınav kaydedilemedi. İnternet bağlantınızı kontrol edin.');
    }
  };

  const resetProgress = () => {
    Alert.alert(
      'İlerlemeyi Sıfırla',
      'Bu sınava ait tüm cevaplar ve ilerleme silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.resetPool(category, year, sinavTuru);
              await Promise.all([
                AsyncStorage.removeItem(storageKey),
                AsyncStorage.removeItem(submittedKey)
              ]);
              setQuestionTimes({});
              setIsExamFinished(false);
              setIsExamSubmitted(false);
              resetTimer();
              setCurrentIdx(0);
              await loadQuestions(); // Soruları sıfırlanmış haliyle yeniden yükle
            } catch (err) {
              console.error('Reset error', err);
              Alert.alert('Hata', 'İlerleme sıfırlanamadı.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const isAnswered = !!(selectedAnswer || (currentQuestion?.status && currentQuestion.status !== 'empty'));

  // Soru bazlı süre takibi (Cevaplanmadıysa sayar, cevaplandıysa veya sınav bittiyse/tamamlandıysa dondurur)
  React.useEffect(() => {
    if (!currentQuestion?.id || isFinished) return;
    if (isAnswered) return;

    const interval = setInterval(() => {
      setQuestionTimes(prev => {
        const nextTimes = {
          ...prev,
          [currentQuestion.id]: (prev[currentQuestion.id] || 0) + 1
        };
        AsyncStorage.setItem(storageKey, JSON.stringify(nextTimes)).catch(() => {});
        return nextTimes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion?.id, isAnswered, isFinished, storageKey]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}><ActivityIndicator size="large" color="#6366f1" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView className="flex-1">
        <QuizHeader
          onBack={() => navigation.goBack()} timer={timer} formatTime={formatTime}
          onFinish={() => Alert.alert('Sınavı Bitir', 'Emin misiniz?', [{ text: 'İptal' }, { text: 'Bitir', onPress: handleFinish }])}
          stats={stats} currentIdx={currentIdx} totalQuestions={questions.length}
        />

        <QuestionGrid
          questions={questions}
          currentIdx={currentIdx}
          onJump={jumpToQuestion}
        />

        <ScrollView className="flex-1" scrollEnabled={!isDrawingMode && !isPinching} showsVerticalScrollIndicator={false}>
          <View className="p-5">
            <View className="bg-slate-900 p-4 rounded-3xl mb-6 shadow-xl border border-slate-700 flex-row justify-between items-center">
              <View className="space-y-1">
                <Text className="text-xs font-bold text-white uppercase">SINAV YILI: <Text className="text-indigo-400">{year}</Text></Text>
                <Text className="text-xs font-bold text-white uppercase">KONU: <Text className="text-indigo-400">{category}</Text></Text>
                <Text className="text-xs font-bold text-white uppercase">SORU NO: <Text className="text-indigo-400">{currentIdx + 1}</Text></Text>
              </View>

              <View className="bg-amber-500/20 px-3 py-2 rounded-2xl border border-amber-500/30 flex-row items-center space-x-1">
                <Text className="text-xs">⏱️</Text>
                <Text className="text-xs font-mono font-bold text-amber-300">
                  {formatTime(questionTimes[currentQuestion?.id] || 0)}
                </Text>
              </View>
            </View>

            <View className="w-full bg-white rounded-3xl mb-6 items-center overflow-hidden">
              <Text className="text-[9px] font-black text-slate-300 mb-2 self-end">KPSS HUB ENGINE v1.0</Text>
              <TapGestureHandler
                numberOfTaps={2}
                onHandlerStateChange={(event) => {
                  if (event.nativeEvent.state === State.ACTIVE) handleResetZoom();
                }}
              >
                <Animated.View>
                  <PanGestureHandler
                    ref={panRef}
                    simultaneousHandlers={pinchRef}
                    onGestureEvent={onPanEvent}
                    onHandlerStateChange={onPanStateChange}
                    enabled={!isDrawingMode && lastScale.current > 1} // Sadece zoom'dayken sürüklemeye izin ver
                    minPointers={1}
                    maxPointers={1}
                  >
                    <Animated.View>
                      <PinchGestureHandler
                        ref={pinchRef}
                        simultaneousHandlers={panRef}
                        onGestureEvent={onPinchEvent}
                        onHandlerStateChange={onPinchStateChange}
                        enabled={!isDrawingMode}
                      >
                        <Animated.Image
                          source={{ uri: currentQuestion?.soru_resmi ? api.getImageUrl(currentQuestion.soru_resmi) : '' }}
                          style={{
                            width: width - 24,
                            height: 520,
                            transform: [{ scale }, { translateX }, { translateY }]
                          }}
                          resizeMode="contain"
                        />
                      </PinchGestureHandler>
                    </Animated.View>
                  </PanGestureHandler>
                </Animated.View>
              </TapGestureHandler>
            </View>

            <QuizAnswerPanel
              currentQuestion={currentQuestion} selectedAnswer={selectedAnswer}
              isAnswered={isAnswered} onAnswer={handleAnswer} isDrawingMode={isDrawingMode}
            />

            <View className="flex-row mb-8 mt-4" style={{ gap: 12 }}>
              <TouchableOpacity onPress={prevQuestion} disabled={currentIdx === 0 || isDrawingMode} className={`flex-1 h-16 bg-slate-100 rounded-2xl items-center justify-center ${currentIdx === 0 ? 'opacity-0' : ''}`}><Text className="text-slate-600 font-bold">← Geri</Text></TouchableOpacity>
              <TouchableOpacity onPress={nextQuestion} disabled={currentIdx >= questions.length - 1 || isDrawingMode} className="flex-[2] h-16 bg-slate-900 rounded-2xl items-center justify-center"><Text className="text-white font-bold">Sonraki Soru →</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={resetProgress} className="w-full py-3 bg-rose-500/10 rounded-xl mb-2 border border-rose-500/20">
              <Text className="text-center text-rose-500 font-bold uppercase text-xs tracking-widest"> Tüm İlerlemeyi Sıfırla</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} className="flex-row justify-center items-center py-4 rounded-2xl border border-slate-100 mb-6 bg-slate-50">
              <Icon name={currentQuestion?.is_favorite ? "star" : "star-outline"} size={20} color={currentQuestion?.is_favorite ? "#f59e0b" : "#94a3b8"} />
              <Text className={`font-black ml-2 text-xs uppercase ${currentQuestion?.is_favorite ? 'text-amber-500' : 'text-slate-400'}`}>{currentQuestion?.is_favorite ? '★ FAVORİ' : '☆ FAVORİ'}</Text>
            </TouchableOpacity>

            {currentQuestion?.cozum && (
              <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6">
                <Text className="text-[10px] font-bold text-slate-900 mb-2 uppercase">Çözüm Analizi</Text>
                <Text className="text-sm text-slate-600 leading-6">{currentQuestion.cozum}</Text>
              </View>
            )}
          </View>
        </ScrollView>


      </SafeAreaView>

      {/* Normal ekrandaki çizim katmanı */}
      <DrawingCanvas isDrawingMode={isDrawingMode} />

      {/* Kalem butonu */}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity
          onPress={() => setIsDrawingMode(!isDrawingMode)}
          className={`w-15 h-15 rounded-full items-center justify-center shadow-2xl ${isDrawingMode ? 'bg-black' : 'bg-white border-2 border-slate-900'}`}
          style={{ width: 60, height: 60 }}
        >
          <Icon name={isDrawingMode ? "check-bold" : "pencil"} size={30} color={isDrawingMode ? "white" : "#000"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}