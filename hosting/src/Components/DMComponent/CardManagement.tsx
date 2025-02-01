import { getCampaign, subscribeToCards } from "@/services/firestore";
import { PlayingCard } from "@/services/interfaces";
import { Button, Card, CardContent, CardHeader } from "@mui/material";
import { useEffect, useState } from "react";
import CardList from "../CardList/CardList";

export const basePlayingCard: PlayingCard = {
    id: "",
    name: "",
    rarity: 1,
    type: "",
    description: "",
    usage: 0,
    background: "",
    category: "",
    activation_cost: ""
};

const CardManagement: React.FC<{ CampaignID: string }> = ({ CampaignID }) => {
    const [cards, setCards] = useState<PlayingCard[]>([]);
    const [campaignName, setCampaignName] = useState("");

    useEffect(() => {
        getCampaign(CampaignID).then(campaign => {
            if (campaign) setCampaignName(campaign.name);
        });
        return subscribeToCards(CampaignID, data => setCards(data.map(val => ({ ...basePlayingCard, ...val }))));
    }, [CampaignID]);

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
            <CardHeader title="Card List" />
            <CardContent sx={{ overflow: "auto" }}>
                <Button variant="contained" onClick={backupCards}>Backup Cards</Button>
                <CardList campaignID={CampaignID} enableSorting enableFiltering dataSource={cards.map(card => card.id)} isDM={true} />
            </CardContent>
        </Card>
    );
};

export default CardManagement;
