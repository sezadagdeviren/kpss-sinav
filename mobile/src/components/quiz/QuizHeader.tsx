import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface QuizHeaderProps {
  onBack: () => void;
  timer: number;
  formatTime: (s: number) => string;
  onFinish: () => void;
  stats: { correct: number, wrong: number, empty: number };
  currentIdx: number;
  totalQuestions: number;
}

export function QuizHeader({
  onBack, timer, formatTime, onFinish, stats, currentIdx, totalQuestions
}: QuizHeaderProps) {
  return (
    <View>
      {/* Top Bar */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-800">
        <TouchableOpacity onPress={onBack} className="flex-row items-center">
          <Icon name="chevron-left" size={24} color="white" />
          <Text className="text-white font-bold ml-1">Kapat</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[10px] font-black text-rose-400 uppercase tracking-widest">KRONOMETRE</Text>
          <Text className="text-white font-black text-lg">{formatTime(timer)}</Text>
        </View>
        <TouchableOpacity onPress={onFinish} className="bg-rose-500 px-4 py-2 rounded-xl">
          <Text className="text-white font-black text-[10px] uppercase">SINAVI BİTİR</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View className="flex-row justify-around py-4 bg-slate-50 border-b border-slate-100">
        <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">DOĞRU</Text><Text className="text-xl font-black text-emerald-500">{stats.correct}</Text></View>
        <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">YANLIŞ</Text><Text className="text-xl font-black text-rose-500">{stats.wrong}</Text></View>
        <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">BOŞ</Text><Text className="text-xl font-black text-slate-700">{stats.empty}</Text></View>
        <View className="items-center"><Text className="text-[9px] font-bold text-slate-400">SORU</Text><Text className="text-xl font-black text-indigo-600">{currentIdx + 1}/{totalQuestions}</Text></View>
      </View>
    </View>
  );
}
