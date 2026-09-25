import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Grid
} from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import CardList from "../../CardList/CardList";
import { upsertCard } from "@/services/firestore";
import { PlayingCard } from "@/services/interfaces";
import { basePlayingCard } from "./CardManagement";

interface CardImporterProps {
  open: boolean;
  onClose: () => void;
  onImport: (cards: PlayingCard[]) => void;
  campaignID: string;
}

const CardImporter: React.FC<CardImporterProps> = ({ open, onClose, campaignID }) => {
  const [fileError, setFileError] = useState<string | null>(null);
  const [leftList, setLeftList] = useState<PlayingCard[]>([]); // New cards
  const [rightList, setRightList] = useState<PlayingCard[]>([]); // To import
  const [fileName, setFileName] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importComplete, setImportComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) throw new Error("JSON must be an array of cards");
  // Type guard for PlayingCard shape
  const isCard = (c: unknown): c is Partial<PlayingCard> => typeof c === 'object' && c !== null && 'id' in c && 'name' in c;
  const cards = (json as unknown[]).filter(isCard).map((c) => ({ ...basePlayingCard, ...c }));
        setLeftList(cards);

        console.log('Imported cards:', cards);
        setRightList([]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setFileError("Invalid JSON file: " + errorMsg);
        setLeftList([]);
        setRightList([]);
      }
    };
    reader.readAsText(file);
  };

  // Move single card from left to right
  const moveToRight = (cardId: string) => {
    const card = leftList.find((c) => c.id === cardId);
    if (!card) return;
    setLeftList(leftList.filter((c) => c.id !== cardId));
    setRightList([...rightList, card]);
  };
  // Move single card from right to left
  const moveToLeft = (cardId: string) => {
    const card = rightList.find((c) => c.id === cardId);
    if (!card) return;
    setRightList(rightList.filter((c) => c.id !== cardId));
    setLeftList([...leftList, card]);
  };
  // Move all left to right
  const moveAllToRight = () => {
    setRightList([...rightList, ...leftList]);
    setLeftList([]);
  };
  // Move all right to left
  const moveAllToLeft = () => {
    setLeftList([...leftList, ...rightList]);
    setRightList([]);
  };

  const handleAccept = async () => {
    setImporting(true);
    setImportProgress(0);
    for (let i = 0; i < rightList.length; i++) {
      await upsertCard(campaignID, rightList[i]);
      setImportProgress(Math.round(((i + 1) / rightList.length) * 100));
    }
    setImporting(false);
    setImportComplete(true);
    setRightList([]);
    setTimeout(() => {
      setImportComplete(false);
      handleClose();
    }, 3000);
  };
  const handleClose = () => {
    setLeftList([]);
    setRightList([]);
    setFileName("");
    setFileError(null);
    setImporting(false);
    setImportProgress(0);
    setImportComplete(false);
    onClose();
  };

  // Custom controls for CardList
  type CardListItemType = { cardId: string };
  const leftControls = (item: CardListItemType) => (
    <IconButton onClick={() => moveToRight(item.cardId)} title="Move to import">
      <ArrowForwardIcon />
    </IconButton>
  );
  const rightControls = (item: CardListItemType) => (
    <IconButton onClick={() => moveToLeft(item.cardId)} title="Remove from import">
      <ArrowBackIcon />
    </IconButton>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle>Import Cards</DialogTitle>
      <DialogContent>
        {importing && (
          <Box mb={2}>
            <Typography>Importing cards... {importProgress}%</Typography>
            <Box sx={{ width: '100%', mt: 1 }}>
              <Box sx={{ height: 10, background: '#eee', borderRadius: 5 }}>
                <Box sx={{ height: 10, width: `${importProgress}%`, background: '#1976d2', borderRadius: 5, transition: 'width 0.3s' }} />
              </Box>
            </Box>
          </Box>
        )}
        {importComplete && (
          <Box mb={2}>
            <Typography color="success.main">Import completed!</Typography>
          </Box>
        )}
        <Box mb={2}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
          >
            Upload JSON File
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {fileName && (
            <Typography variant="body2" ml={2} display="inline">{fileName}</Typography>
          )}
          {fileError && (
            <Typography color="error">{fileError}</Typography>
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="h6">Available Cards</Typography>
            <Button
              variant="outlined"
              startIcon={<DoubleArrowIcon />}
              onClick={moveAllToRight}
              disabled={leftList.length === 0}
              sx={{ mb: 1 }}
            >
              Move All →
            </Button>
            <CardList
              campaignID={campaignID}
              dataSource={leftList.map((c) => c.id)}
              isDM={true}
              enableFiltering
              customControls={leftControls}
              customCardSource={leftList}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="h6">Cards to Import</Typography>
            <Button
              variant="outlined"
              startIcon={<DoubleArrowIcon style={{ transform: 'rotate(180deg)' }} />}
              onClick={moveAllToLeft}
              disabled={rightList.length === 0}
              sx={{ mb: 1 }}
            >
              ← Move All
            </Button>
            <CardList
              campaignID={campaignID}
              dataSource={rightList.map((c) => c.id)}
              isDM={true}
              enableFiltering
              customControls={rightControls}
              customCardSource={rightList}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        {!(importing || importComplete) && (
          <>
            <Button onClick={handleClose} color="secondary">Cancel</Button>
            <Button onClick={handleAccept} color="primary" variant="contained" disabled={rightList.length === 0}>Accept</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CardImporter;
