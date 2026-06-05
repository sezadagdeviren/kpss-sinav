import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { Question } from '../../types';

interface QuestionGridProps {
  questions: Question[];
  currentIdx: number;
  onJump: (idx: number) => void;
}

export function QuestionGrid({ questions, currentIdx, onJump }: QuestionGridProps) {
  return (
    <View className="bg-white border-b border-slate-100 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIdx;
          const isAnswered = q.status && q.status !== 'empty';

          let btnClass = "w-10 h-10 rounded-xl items-center justify-center border mx-1";
          let txtClass = "font-black text-xs";

          if (isAnswered) {
            btnClass += " bg-indigo-50 border-indigo-100";
            txtClass += " text-indigo-600";
          } else {
            btnClass += " bg-slate-50 border-slate-100";
            txtClass += " text-slate-400";
          }

          if (isCurrent) {
            btnClass = "w-10 h-10 rounded-xl items-center justify-center bg-indigo-600 border-transparent shadow-lg shadow-indigo-200";
            txtClass = "font-black text-xs text-white";
          }

          return (
            <TouchableOpacity key={idx} onPress={() => onJump(idx)} className={btnClass}>
              <Text className={txtClass}>{idx + 1}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
