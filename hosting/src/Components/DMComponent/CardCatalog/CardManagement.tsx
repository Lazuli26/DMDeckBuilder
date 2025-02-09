import { PlayingCard } from "@/services/interfaces";
import { IconButton, Card, CardContent, CardHeader, Tooltip } from "@mui/material";
import { useState } from "react";
import CardList from "../../CardList/CardList";
import CardEditor from "./CardEditor";
import { useAppSelector } from "@/store/reduxHooks";
import BackupIcon from '@mui/icons-material/Backup';
import AddIcon from '@mui/icons-material/Add';

export const basePlayingCard: PlayingCard = {
    id: "",
    name: "",
    rarity: 1,
    type: "",
    description: "",
    usage: 0,
    background: "",
    activation_cost: ""
};

const CardManagement: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const cards = useAppSelector(state => state.campaign.value?.cards || []).map(val => ({ ...basePlayingCard, ...val }));
    const campaignName = useAppSelector(state => state.campaign.value?.name) || "";
    const [cardEditorId, setCardEditorId] = useState<string | null>(null);

    const backupCards = () => {
        const date = new Date();
        const formattedDate = date.toISOString().slice(0, 16).replace("T", " ");
        const fileName = `${campaignName} ${formattedDate}.json`;
        const json = JSON.stringify(cards, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Card>
            <CardHeader 
                title="Card List" 
                action={
                    <>
                        <Tooltip title="Backup Cards">
                            <IconButton color="primary" onClick={backupCards}>
                                <BackupIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Create New Card">
                            <IconButton color="primary" onClick={() => setCardEditorId("")} sx={{ marginLeft: 2 }}>
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                    </>
                } 
            />
            <CardContent sx={{ overflow: "auto" }}>
                <CardList campaignID={CampaignID} enableSorting enableFiltering dataSource={cards.map(card => card.id)} isDM={true} />
            </CardContent>
            {cardEditorId != null && (
                <CardEditor
                    open={cardEditorId != null}
                    cardId={cardEditorId}
                    campaignID={CampaignID}
                    onClose={() => setCardEditorId(null)}
                    onSave={() => setCardEditorId(null)}
                />
            )}
        </Card>
    );
};

export default CardManagement;
