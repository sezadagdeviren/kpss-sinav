import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  isDrawingMode: boolean;
  onPathsChange?: (paths: string[]) => void;
  initialPaths?: string[];
}

export default function DrawingCanvas({ isDrawingMode, onPathsChange, initialPaths = [] }: Props) {
  const [paths, setPaths] = useState<string[]>(initialPaths);
  const activePathRef = useRef<any>(null);
  const currentD = useRef<string>("");
  const lastPoint = useRef<{ x: number, y: number } | null>(null);

  const onGestureEvent = (event: any) => {
    if (!isDrawingMode || !activePathRef.current) return;
    const { x, y } = event.nativeEvent;
    if (!lastPoint.current) {
      currentD.current = `M${x.toFixed(0)},${y.toFixed(0)}`;
      lastPoint.current = { x, y };
    } else {
      const dist = Math.hypot(x - lastPoint.current.x, y - lastPoint.current.y);
      if (dist > 2) {
        currentD.current += ` L${x.toFixed(0)},${y.toFixed(0)}`;
        activePathRef.current.setNativeProps({ d: currentD.current });
        lastPoint.current = { x, y };
      }
    }
  };

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END && currentD.current) {
      const newPaths = [...paths, currentD.current];
      setPaths(newPaths);
      onPathsChange?.(newPaths);
      currentD.current = "";
      if (activePathRef.current) activePathRef.current.setNativeProps({ d: "" });
      lastPoint.current = null;
    }
  };

  const undo = () => {
    const newPaths = paths.slice(0, -1);
    setPaths(newPaths);
    onPathsChange?.(newPaths);
  };

  const clearAll = () => {
    setPaths([]);
    onPathsChange?.([]);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isDrawingMode ? "auto" : "none"}>
      <PanGestureHandler
        enabled={isDrawingMode}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <View style={StyleSheet.absoluteFill}>
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((path, index) => (
              <Path key={index} d={path} stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            <Path ref={activePathRef} d="" stroke="#000" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </PanGestureHandler>

      {isDrawingMode && (
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={clearAll} style={[styles.btn, { backgroundColor: '#ef4444' }]}>
            <Icon name="trash-can-outline" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={undo} style={styles.btn}>
            <Icon name="undo-variant" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    bottom: 110, // Kalem butonunun hemen üstünde
    right: 28, // Kalem butonuyla hizalı (60px genişlik / 2 = 30px orta)
    gap: 15,
    alignItems: 'center'
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  }
});
