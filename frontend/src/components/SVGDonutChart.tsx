import React, { useState } from 'react';
import { Box, Typography, Stack } from '@mui/material';

interface CurrencyData {
  count: number;
  balance: number;
}

interface SVGDonutChartProps {
  currencyDist: Record<string, CurrencyData>;
  isDark: boolean;
}

export default function SVGDonutChart({ currencyDist = {}, isDark }: SVGDonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Convert map to list and exclude zero balance currencies
  const rawItems = Object.entries(currencyDist).map(([currency, data]) => ({
    currency,
    count: data.count,
    balance: data.balance,
  }));

  const items = rawItems.filter(item => item.balance > 0);
  const totalBalance = items.reduce((acc, curr) => acc + curr.balance, 0);

  if (items.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">Aucun solde actif en base</Typography>
      </Box>
    );
  }

  // Segment colors
  const colors: Record<string, string> = {
    MAD: '#30CFEF', // Cyan
    EUR: '#10B981', // Digital Emerald
    USD: '#8B5CF6', // Royal Purple
    INCONNU: '#64748B',
  };

  const fallbackColors = ['#30CFEF', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'];

  const getCol = (currency: string, idx: number) => {
    return colors[currency] || fallbackColors[idx % fallbackColors.length];
  };

  // Math for segmented circle
  const radius = 50;
  const strokeWidth = 12;
  const center = 80;
  const circumference = 2 * Math.PI * radius; // ~314.16

  // Pre-calculate segments coordinates/offsets
  let accumulatedPercent = 0;
  const segments = items.map((item, idx) => {
    const percent = totalBalance > 0 ? item.balance / totalBalance : 0;
    const dashArray = `${percent * circumference} ${circumference}`;
    // SVG stroke-dashoffset counts backwards, starting angle is -90 deg (top)
    const dashOffset = circumference - (accumulatedPercent * circumference);
    accumulatedPercent += percent;

    return {
      ...item,
      percent,
      dashArray,
      dashOffset,
      color: getCol(item.currency, idx)
    };
  });

  // Hover item details
  const activeItem = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', width: '100%', textAlign: 'left' }}>
        Répartition par Devise
      </Typography>

      <Box sx={{ position: 'relative', width: 160, height: 160, mb: 2 }}>
        <svg 
          viewBox="0 0 160 160" 
          width="100%" 
          height="100%"
          style={{ overflow: 'visible', transform: 'rotate(-90deg)' }} // Rotate so first segment starts at top
        >
          {/* Base circle background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
            strokeWidth={strokeWidth}
          />

          {/* Dynamic segments */}
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-width 0.15s ease-in-out, stroke 0.15s',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Dynamic center text overlay */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          width: '70%',
          overflow: 'hidden'
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeItem ? activeItem.currency : 'Encours Total'}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.1, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            {activeItem 
              ? `${activeItem.balance.toLocaleString('fr-FR')} ${activeItem.currency}`
              : `${totalBalance.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DH`
            }
          </Typography>
          <Typography variant="caption" sx={{ color: activeItem ? activeItem.color : 'primary.main', fontWeight: 700, fontSize: '0.65rem' }}>
            {activeItem 
              ? `${(activeItem.percent * 100).toFixed(1)}%`
              : 'Équivalent MAD'
            }
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Stack spacing={1} direction="row" sx={{ width: '100%', gap: 1.5, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((seg, idx) => (
          <Box 
            key={idx} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45,
              transition: 'opacity 0.15s'
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: seg.color, mr: 0.75 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {seg.currency} ({Math.round(seg.percent * 100)}%)
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
