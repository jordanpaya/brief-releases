import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme';

type Point = { value: number };

// A tiny dependency-free line chart for estimated-1RM growth. Renders flat
// gracefully when there's only one data point.
export function LineChart({
  data,
  width,
  height = 120,
  color = colors.accent,
}: {
  data: Point[];
  width: number;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) return <View style={{ width, height }} />;

  const padX = 6;
  const padY = 12;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) =>
    data.length === 1 ? padX + w / 2 : padX + (i / (data.length - 1)) * w;
  const y = (v: number) => padY + h - ((v - min) / range) * h;

  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill under the line.
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padY + h).toFixed(
          1,
        )} L ${points[0].x.toFixed(1)} ${(padY + h).toFixed(1)} Z`
      : '';

  return (
    <Svg width={width} height={height}>
      {/* baseline */}
      <Line x1={padX} y1={padY + h} x2={padX + w} y2={padY + h} stroke={colors.border} strokeWidth={1} />
      {areaPath ? <Path d={areaPath} fill={color} opacity={0.12} /> : null}
      {points.length > 1 ? (
        <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" />
      ) : null}
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === points.length - 1 ? 4.5 : 3}
          fill={i === points.length - 1 ? color : colors.bg}
          stroke={color}
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}
