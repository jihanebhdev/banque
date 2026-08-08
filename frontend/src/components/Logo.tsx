import React from 'react';
import { Typography, Box } from '@mui/material';
import { useConfigStore } from '../store/configStore';

interface LogoProps {
  onDarkBg?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function Logo({ onDarkBg = false, size = 'medium' }: LogoProps) {
  const { bankName, logoUrl } = useConfigStore();

  const getFontSize = () => {
    switch (size) {
      case 'small': return '1.5rem';
      case 'large': return '3.2rem';
      default: return '2.2rem';
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'small': return '36px';
      case 'large': return '64px';
      default: return '48px';
    }
  };

  if (logoUrl) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <img src={logoUrl} alt={bankName} style={{ height: getHeight(), objectFit: 'contain' }} />
      </Box>
    );
  }

  return (
    <Typography 
      variant="h6" 
      component="div" 
      sx={{ 
        fontWeight: 950, 
        fontStyle: 'italic', 
        fontSize: getFontSize(),
        letterSpacing: '-0.05em',
        color: onDarkBg ? '#FFFFFF' : '#54E3FF', 
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        userSelect: 'none'
      }}
    >
      <span style={{ color: '#54E3FF' }}>{bankName}</span>
    </Typography>
  );
}
