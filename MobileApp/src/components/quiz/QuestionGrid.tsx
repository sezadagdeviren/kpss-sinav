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
      {/* Vertical scroll grid similar to web version */}
      <ScrollView
        style={{ maxHeight: 80 }}
        contentContainerStyle={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 2,
          paddingHorizontal: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {questions.map((q, idx) => {
          const isCurrent = idx === currentIdx;
          const status = q.status;

          let btnClass = 'w-6 h-6 rounded-md items-center justify-center border mx-0.5';
          let txtClass = 'font-black text-xs';

          if (status === 'correct') {
            btnClass += ' bg-emerald-50 border-emerald-200';
            txtClass += ' text-emerald-600';
          } else if (status === 'wrong') {
            btnClass += ' bg-rose-50 border-rose-200';
            txtClass += ' text-rose-600';
          } else {
            btnClass += ' bg-slate-50 border-slate-100';
            txtClass += ' text-slate-400';
          }

          if (isCurrent) {
            btnClass = 'w-8 h-8 rounded-md items-center justify-center bg-indigo-600 border-indigo-700 shadow-lg shadow-indigo-200';
            txtClass = 'font-black text-xs text-white';
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