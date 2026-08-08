import React, { useState } from 'react';
import { Box, Typography, ButtonGroup, Button, Tooltip } from '@mui/material';

interface TrendItem {
  date: string;
  count: number;
  volume: number;
}

interface SVGLineAreaChartProps {
  data: TrendItem[];
  isDark: boolean;
}

export default function SVGLineAreaChart({ data = [], isDark }: SVGLineAreaChartProps) {
  const [metric, setMetric] = useState<'volume' | 'count'>('volume');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">Aucune donnée de tendance disponible</Typography>
      </Box>
    );
  }

  // Dimensions
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Extract values
  const values = data.map(d => metric === 'volume' ? d.volume : d.count);
  const maxVal = Math.max(...values, metric === 'volume' ? 1000 : 5);
  const minVal = 0;
  const range = maxVal - minVal;

  // Map data to SVG coordinates
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const val = metric === 'volume' ? d.volume : d.count;
    // SVG coordinates start at top-left, so invert Y
    const y = paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, item: d, val };
  });

  // Build SVG path
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    // Simple line connections
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    // Build area closed path
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  // Grid lines
  const gridLinesY = [0, 0.25, 0.5, 0.75, 1];

  const formatYLabel = (val: number) => {
    if (metric === 'volume') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M DH`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}k DH`;
      return `${val} DH`;
    }
    return String(Math.round(val));
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`; // dd/MM
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Flux Financier & Activités (7J)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Évolution des volumes et du nombre de virements
          </Typography>
        </Box>
        <ButtonGroup size="small" variant="outlined" color="primary">
          <Button 
            onClick={() => setMetric('volume')} 
            variant={metric === 'volume' ? 'contained' : 'outlined'}
            sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
          >
            Volume (DH)
          </Button>
          <Button 
            onClick={() => setMetric('count')} 
            variant={metric === 'count' ? 'contained' : 'outlined'}
            sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
          >
            Opérations
          </Button>
        </ButtonGroup>
      </Box>

      {/* SVG Drawing Container */}
      <Box sx={{ position: 'relative', width: '100%', overflow: 'visible' }}>
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          width="100%" 
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradient fill */}
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#30CFEF" stopOpacity={isDark ? 0.35 : 0.25} />
              <stop offset="100%" stopColor="#30CFEF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLinesY.map((ratio, index) => {
            const y = paddingTop + chartHeight * ratio;
            const gridVal = maxVal - (ratio * range);
            return (
              <g key={index}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'} 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  fill={isDark ? '#94A3B8' : '#64748B'} 
                  style={{ fontSize: 9, fontFamily: 'monospace' }}
                >
                  {formatYLabel(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          {areaD && (
            <path 
              d={areaD} 
              fill="url(#chart-area-grad)" 
            />
          )}

          {/* Main line path */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="#30CFEF" 
              strokeWidth={2.5} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Bottom date labels */}
          {points.map((p, idx) => (
            <text 
              key={idx}
              x={p.x} 
              y={svgHeight - 10} 
              textAnchor="middle" 
              fill={isDark ? '#94A3B8' : '#64748B'} 
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              {formatDateLabel(p.item.date)}
            </text>
          ))}

          {/* Interactive dots and hover trigger areas */}
          {points.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                {/* Visual circle dot */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? 5 : 3.5} 
                  fill={isHovered ? '#10B981' : '#30CFEF'} 
                  stroke={isDark ? '#020617' : '#FFFFFF'} 
                  strokeWidth={1.5}
                  style={{ transition: 'all 0.15s ease-in-out' }}
                />
                
                {/* Larger transparent hover capture circle */}
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={15} 
                  fill="transparent" 
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Custom tooltip overlay outside SVG (relative HTML positioning) */}
        {hoveredIdx !== null && points[hoveredIdx] && (
          <Box sx={{
            position: 'absolute',
            left: `${(points[hoveredIdx].x / svgWidth) * 100}%`,
            top: `${(points[hoveredIdx].y / svgHeight) * 100 - 30}%`,
            transform: 'translate(-50%, -100%)',
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(84, 227, 255, 0.25)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            borderRadius: '5px',
            p: 1,
            zIndex: 100,
            pointerEvents: 'none',
            minWidth: 120,
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
              {new Date(points[hoveredIdx].item.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Typography>
            <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 800, mt: 0.25 }}>
              {metric === 'volume' 
                ? `${points[hoveredIdx].val.toLocaleString('fr-FR')} DH`
                : `${points[hoveredIdx].val} opérations`
              }
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
