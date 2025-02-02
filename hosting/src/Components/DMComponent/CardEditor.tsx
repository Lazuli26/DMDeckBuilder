import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, FormControl, InputLabel, Select, MenuItem, Autocomplete } from "@mui/material";
import { PlayingCard } from "@/services/interfaces";
import { useState, useEffect } from "react";
import { generateUUID } from "@/services/utils";
import { upsertCard, removeCard } from "@/services/firestore";
import { rarities } from "@/services/constants";
import store from "@/store";

interface CardEditorProps {
    open: boolean;
    cardId: string;
    campaignID: string;
    onClose: () => void;
    onSave: (card: PlayingCard) => void;
}

const CardEditor: React.FC<CardEditorProps> = ({ open, cardId, campaignID, onClose, onSave }) => {
    const [cardEditor, setCardEditor] = useState<PlayingCard | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (cardId === "") {
            setCardEditor({
                id: generateUUID(),
                name: "",
                rarity: 1,
                type: "",
                description: "",
                usage: 0,
                background: "",
                category: "",
                activation_cost: ""
            });
        } else {
            for (const card of store.getState().campaign.value?.cards || []) {
                if (card.id === cardId) {
                    setCardEditor({ ...card });
                    return;
                }
            }
        }
    }, [cardId, campaignID]);

    const submitError = {
        name: cardEditor?.name === "",
        type: cardEditor?.type === "",
        uses: cardEditor?.usage === 0 || (cardEditor?.usage || 0) < -1,
        description: cardEditor?.description === ""
    };

    const handleSave = async () => {
        if (cardEditor) {
            await upsertCard(campaignID, cardEditor);
            onSave(cardEditor);
        }
    };

    const handleRemove = async () => {
        if (cardEditor) {
            await removeCard(campaignID, cardEditor.id);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{cardEditor?.id || "New Card"}</DialogTitle>
            <DialogContent>
                <TextField
                    sx={{ marginTop: 2 }}
                    fullWidth
                    error={submitError.name}
                    id="cardname"
                    label="Name"
                    variant="outlined"
                    value={cardEditor?.name || ""}
                    onChange={(e) => setCardEditor(d => ({ ...d!, name: e.target.value || "" }))}
                />
                <TextField
                    sx={{ marginTop: 2 }}
                    fullWidth
                    error={submitError.type}
                    id="type"
                    label="Activation Type"
                    variant="outlined"
                    value={cardEditor?.type || ""}
                    onChange={(e) => setCardEditor(d => ({ ...d!, type: e.target.value || "" }))}
                />
                <Autocomplete
                    onChange={(e, v) => setCardEditor(d => ({ ...d!, category: v || "" }))}
                    freeSolo
                    disableClearable
                    value={cardEditor?.category || ""}
                    id="category-autocomplete"
                    options={[...new Set(cardEditor?.category ? [cardEditor.category] : [])].filter(val => val !== "").sort()}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            sx={{ marginTop: 2 }}
                            fullWidth
                            id="category"
                            label="Card Category"
                            variant="outlined"
                        />
                    )}
                />
                <FormControl sx={{ marginTop: 2 }} fullWidth>
                    <InputLabel id="rarity-selector-label">Rarity</InputLabel>
                    <Select
                        labelId="rarity-selector-label"
                        id="rarity-selector"
                        value={cardEditor?.rarity || 1}
                        label="Rarity"
                        onChange={(e) => setCardEditor(d => ({ ...d!, rarity: parseInt(e.target.value as string) || 1 }))}
                    >
                        {Object.entries(rarities).map(([i, v]) => (
                            <MenuItem key={i} value={i}>{v.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    sx={{ marginTop: 2 }}
                    fullWidth
                    error={submitError.uses}
                    type="number"
                    id="uses"
                    label="Uses"
                    variant="outlined"
                    value={cardEditor?.usage || ""}
                    onChange={(e) => setCardEditor(d => ({ ...d!, usage: parseInt(e.target.value as string) || 0 }))}
                />
                <TextField
                    sx={{ marginTop: 2 }}
                    fullWidth
                    id="cost"
                    label="Activation Cost"
                    variant="outlined"
                    value={cardEditor?.activation_cost || ""}
                    onChange={(e) => setCardEditor(d => ({ ...d!, activation_cost: e.target.value || "" }))}
                />
                <TextField
                    sx={{ marginTop: 2 }}
                    fullWidth
                    id="background"
                    label="Background"
                    variant="outlined"
                    value={cardEditor?.background || ""}
                    onChange={(e) => setCardEditor(d => ({ ...d!, background: e.target.value || "" }))}
                />
                <TextField
                    sx={{ marginTop: 2 }}
                    fullWidth
                    error={submitError.description}
                    id="description"
                    multiline
                    label="Description"
                    variant="outlined"
                    value={cardEditor?.description || ""}
                    onChange={(e) => setCardEditor(d => ({ ...d!, description: e.target.value || "" }))}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {cardId !== "" && (
                    <>
                        <Button color="error" onClick={() => setConfirmDelete(true)}>Delete</Button>
                        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                            <DialogTitle>Confirm Delete</DialogTitle>
                            <DialogContent>
                                Are you sure you want to delete this card?
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                                <Button color="error" onClick={handleRemove}>Delete</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
                <Button
                    variant="contained"
                    disabled={submitError.description || submitError.name || submitError.type || submitError.uses}
                    onClick={handleSave}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CardEditor;
