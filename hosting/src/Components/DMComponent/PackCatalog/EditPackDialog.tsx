"use client"

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Tabs, Tab, Box, Typography } from "@mui/material";
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
    onToggleCardInPack: (cardId: string) => void;
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
    tabIndex,
    onClose,
    onSave,
    onPackChange,
    onToggleCardInPack,
    onWeightChange,
    onTabChange}) => {


    return (
        <Dialog open={open} maxWidth="md" fullWidth onClose={onClose}>
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
                    <CardList
                        campaignID={campaignID}
                        dataSource={pack}
                        packEditControls={{
                            toggleCard: onToggleCardInPack,
                            changeWeight: onWeightChange
                        }}
                        enableSorting={true}
                        enableFiltering={true}
                    />
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
