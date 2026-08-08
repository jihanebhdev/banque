import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface AdvisorItem {
  email: string;
  count: number;
}

interface SVGAdvisorBarChartProps {
  data: AdvisorItem[];
  isDark: boolean;
}

export default function SVGAdvisorBarChart({ data = [], isDark }: SVGAdvisorBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">Aucune activité enregistrée sur 30J</Typography>
      </Box>
    );
  }

  // Maximum value for scaling
  const maxCount = Math.max(...data.map(d => d.count), 5);

  // Helper to extract clean name from email
  const formatName = (email: string) => {
    try {
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1)} ${parts[1].charAt(0).toUpperCase()}${parts[1].slice(1)}`;
      }
      return email.split('@')[0];
    } catch {
      return email;
    }
  };

  const barHeight = 16;
  const spacingY = 24;
  const svgHeight = Math.max(data.length * spacingY + 30, 160);
  const svgWidth = 450;
  const paddingLeft = 140;
  const paddingRight = 45;
  const chartWidth = svgWidth - paddingLeft - paddingRight;

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
        Activité des Conseillers (30J)
      </Typography>

      <Box sx={{ position: 'relative', width: '100%' }}>
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          width="100%" 
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="advisor-bar-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#30CFEF" />
            </linearGradient>
          </defs>

          {data.map((item, idx) => {
            const y = idx * spacingY + 15;
            const barWidth = (item.count / maxCount) * chartWidth;
            const isHovered = hoveredIdx === idx;

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Advisor name label */}
                <text
                  x={paddingLeft - 15}
                  y={y + 12}
                  textAnchor="end"
                  fill={isHovered ? 'primary.main' : (isDark ? '#E2E8F0' : '#334155')}
                  style={{ 
                    fontSize: 10.5, 
                    fontWeight: isHovered ? 800 : 700,
                    transition: 'all 0.15s'
                  }}
                >
                  {formatName(item.email)}
                </text>

                {/* Background track */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={chartWidth}
                  height={barHeight}
                  rx={4}
                  fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                />

                {/* Animated colored bar */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="url(#advisor-bar-grad)"
                  style={{
                    transition: 'width 0.3s ease-out, filter 0.15s',
                    filter: isHovered ? 'brightness(1.15) drop-shadow(0 0 4px rgba(84,227,255,0.45))' : 'none'
                  }}
                />

                {/* Value label on the right */}
                <text
                  x={paddingLeft + barWidth + 10}
                  y={y + 12}
                  fill={isHovered ? '#30CFEF' : (isDark ? '#94A3B8' : '#64748B')}
                  style={{ 
                    fontSize: 10.5, 
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    transition: 'fill 0.15s'
                  }}
                >
                  {item.count}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Box>
  );
}
