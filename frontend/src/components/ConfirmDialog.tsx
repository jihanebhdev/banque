import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography
} from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  severity = 'warning'
}: ConfirmDialogProps) {
  
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <ErrorRoundedIcon sx={{ color: 'error.main', fontSize: 32 }} />;
      case 'success':
        return <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 32 }} />;
      case 'info':
        return <InfoRoundedIcon sx={{ color: 'primary.main', fontSize: 32 }} />;
      case 'warning':
      default:
        return <WarningRoundedIcon sx={{ color: 'warning.main', fontSize: 32 }} />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      case 'info':
      case 'warning':
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{
        paper: {
          className: 'glass-dialog-paper',
          sx: {
            maxWidth: 420,
            width: '90%',
            p: 1.5,
            border: 'none',
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, pt: 2 }}>
        {getIcon()}
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          {title}
        </Typography>
      </Box>

      <DialogContent sx={{ mt: 1, pb: 1 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: '5px',
            borderColor: 'rgba(255,255,255,0.15)',
            color: 'text.secondary',
            textTransform: 'none',
            fontWeight: 700,
            '&:hover': {
              borderColor: 'text.secondary',
              backgroundColor: 'rgba(255,255,255,0.05)',
            }
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={getConfirmButtonColor()}
          size="small"
          autoFocus
          sx={{
            borderRadius: '5px',
            textTransform: 'none',
            fontWeight: 700,
            px: 2.5
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
