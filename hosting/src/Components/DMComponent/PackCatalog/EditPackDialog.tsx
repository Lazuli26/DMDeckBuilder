"use client"

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, Typography, Grid, IconButton } from "@mui/material";
import DoubleArrowIcon from '@mui/icons-material/DoubleArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Pack, PlayingCard } from "../../../services/interfaces";
import CardList from "../../CardList/CardList";

interface EditPackDialogProps {
    campaignID: string;
    open: boolean;
    pack: Pack;
    cards: PlayingCard[];
    nameFilter: string;
    categoryFilter: string;
    rarityFilter: number | null;
    tabIndex: number;
    onClose: () => void;
    onSave: (pack: Pack) => void;
    onPackChange: (field: keyof Pack, value: string | number) => void;
    onToggleCardInPack: (cardId: string | string[]) => void;
    onWeightChange: (cardId: string, weight: number | null) => void;
    onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
    onNameFilterChange: (value: string) => void;
    onCategoryFilterChange: (value: string) => void;
    onRarityFilterChange: (value: number | null) => void;
}

const EditPackDialog: React.FC<EditPackDialogProps> = ({
    open,
    pack,
    campaignID,
    cards,
    tabIndex,
    onClose,
    onSave,
    onPackChange,
    onToggleCardInPack,
    onWeightChange,
    onTabChange}) => {
    // Split cards into left (not in pack) and right (in pack)
    const packCardIds = new Set(pack.cardPool.map((c: { cardId: string }) => c.cardId));
    const leftList = (Array.isArray(cards) ? cards : []).filter((card: PlayingCard) => !packCardIds.has(card.id));
    const rightList = (Array.isArray(cards) ? cards : []).filter((card: PlayingCard) => packCardIds.has(card.id));

    // Move single card to pack
    const moveToRight = (cardId: string) => {
        onToggleCardInPack(cardId);
    };
    // Remove single card from pack
    const moveToLeft = (cardId: string) => {
        onToggleCardInPack(cardId);
    };
    // Move all to pack
    const moveAllToRight = () => {
        onToggleCardInPack(leftList.map(card => card.id));
    };
    // Remove all from pack
    const moveAllToLeft = () => {
        onToggleCardInPack(rightList.map(card => card.id));
    };

    // Custom controls for left (add to pack)
    const leftControls = (item: { cardId: string }) => (
        <IconButton onClick={() => moveToRight(item.cardId)} title="Add to pack">
            <ArrowForwardIcon />
        </IconButton>
    );
    // Custom controls for right (remove from pack + weight)
    const rightControls = (item: { cardId: string }) => (
        <>
            <IconButton onClick={() => moveToLeft(item.cardId)} title="Remove from pack">
                <ArrowBackIcon />
            </IconButton>
        </>
    );

    // Find weight for a card in the pack
    const getWeight = (cardId: string) => pack.cardPool.find(c => c.cardId === cardId)?.weight ?? 1;

    // Custom controls for right list: remove + weight
    const rightCustomControls = (item: { cardId: string }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {rightControls(item)}
            <TextField
                label="Weight"
                type="number"
                value={getWeight(item.cardId)}
                onChange={e => onWeightChange(item.cardId, parseInt(e.target.value))}
                sx={{ width: 100, ml: 1 }}
            />
        </Box>
    );

    return (
        <Dialog open={open} fullScreen fullWidth onClose={onClose}>
            <DialogTitle>Edit Pack</DialogTitle>
            <DialogContent>
                <Tabs value={tabIndex} onChange={onTabChange} centered>
                    <Tab label="Pack Details" />
                    <Tab label="Pack Contents" />
                </Tabs>
                <Box hidden={tabIndex !== 0}>
                    <TextField
                        label="Pack Name"
                        value={pack?.name || ""}
                        onChange={(e) => onPackChange("name", e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Pack Price"
                        type="number"
                        value={pack?.price || 0}
                        onChange={(e) => onPackChange("price", parseFloat(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Cards Per Pack"
                        type="number"
                        value={pack?.cardsPerPack || 1}
                        onChange={(e) => onPackChange("cardsPerPack", parseInt(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Picks Per Pack"
                        type="number"
                        value={pack?.picksPerPack || 1}
                        onChange={(e) => onPackChange("picksPerPack", parseInt(e.target.value))}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Background Image URL"
                        value={pack?.background || ""}
                        onChange={(e) => onPackChange("background", e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                </Box>
                <Box hidden={tabIndex !== 1}>
                    <Typography variant="h6">Pick {pack?.picksPerPack}</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1">Available Cards</Typography>
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
                                dataSource={leftList.map((c: PlayingCard) => c.id)}
                                isDM={true}
                                enableFiltering
                                customControls={leftControls}
                                customCardSource={leftList}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="subtitle1">Pack Cards</Typography>
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
                                dataSource={rightList.map((c: PlayingCard) => c.id)}
                                isDM={true}
                                enableFiltering
                                customControls={rightCustomControls}
                                customCardSource={rightList}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={() => pack && onSave(pack)} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditPackDialog;
