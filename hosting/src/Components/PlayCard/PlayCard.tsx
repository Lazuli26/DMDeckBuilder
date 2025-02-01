import { subscribeToCard } from "@/services/firestore";
import { PlayingCard } from "@/services/interfaces";
import { Card, CardHeader, Typography, CardContent, CardMedia, Box } from "@mui/material";
import { useEffect, useState } from "react";
import "./style.css";
import { rarities } from "../DMComponent/DMComponent";

export const rarityColors = [
    'rgba(226, 40, 40, 0.75)',
    'rgba(104, 93, 252, 0.75)',
    'rgba(166, 219, 154, 0.75)',
    'rgba(225, 228, 203, 0.75)'
]

const rarityBackgrounds = [
    'https://i.imgur.com/nUWzBNa.jpeg',
    'https://i.imgur.com/Be1ru4O.jpeg',
    'https://i.imgur.com/44MShCg.jpeg',
    'https://i.imgur.com/UjcJonU.jpeg'
]

const highlightStyle = {
    fontWeight: 'bold'
};

const responsiveTitleStyle = {
    textDecoration: 'underline',
    ...highlightStyle,
    fontSize: 'calc(0.75rem + 0.5vw)', // Responsive font size
    //whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
};

const responsiveTextStyle = {
    ...highlightStyle,
    fontSize: 'calc(0.5rem + 0.5vw)' // Responsive font size for other texts
};

const PlayCard: React.FC<{ CampaignID: string, CardID: string, timesUsed?: number }> = ({ CampaignID, CardID, timesUsed }) => {
    const [CardInfo, setCardInfo] = useState<PlayingCard | null>(null);
    const [showCostCategory, setShowCostCategory] = useState(true);

    useEffect(() => {
        subscribeToCard(CampaignID, CardID, data => {
            if (data) setCardInfo(data);
        });
    }, [CampaignID, CardID]);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowCostCategory(prev => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card
            className="Card animated-card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                backgroundImage: `url(${rarityBackgrounds[(CardInfo?.rarity || 1) - 1]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: "8% 8%",
                transform: "rotateZ(-1deg)",
                margin: '5px',
                filter: CardInfo?.category?.toLowerCase() === 'malus' ? 'brightness(75%) hue-rotate(180deg)' : 'none',
            }}
        >
            <CardHeader
                sx={{
                    width: "100%",
                    position: 'relative',
                    zIndex: 2,
                    backgroundColor: rarityColors[(CardInfo?.rarity || 1) - 1],
                    marginBottom: '10px',
                    border: '5px solid black',
                    padding: '2%'
                }}
                title={
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="h5" color="textPrimary" style={responsiveTitleStyle}>
                            {CardInfo?.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            {rarities[(CardInfo?.rarity || 1) as keyof typeof rarities]}
                        </Typography>
                    </Box>
                }
            />
            <CardMedia
                component="img"
                image={CardInfo?.background}
                alt={CardInfo?.name}
                sx={{
                    aspectRatio: "9 / 7",
                    width: "calc(100% - 5%)",
                    objectFit: "cover",
                    justifySelf: "center",
                    border: '5px solid grey',
                    margin: '0 16px',
                    position: 'relative',
                    zIndex: 2
                }}
            />
            <CardContent style={{
                flexGrow: 1,
                width: "100%",
                position: 'relative',
                zIndex: 2,
                backgroundColor: rarityColors[(CardInfo?.rarity || 1) - 1],
                border: '5px solid black',
                margin: '10px 0px',
                padding: '2%',
                overflowY: 'auto', // Enable vertical scrollbar
                minHeight: '4rem', // Set a maximum height for the content
                maxHeight: '200px' // Set a maximum height for the content
            }}>
                <Typography variant="body1" color="textPrimary" style={responsiveTextStyle}>
                    {CardInfo?.description}
                </Typography>
            </CardContent>
            <Box display="flex" justifyContent="space-between" padding="16px" style={{
                marginTop: 'auto',
                width: "100%",
                position: 'relative',
                zIndex: 2,
                backgroundColor: rarityColors[(CardInfo?.rarity || 1) - 1],
                border: '5px solid black',
                padding: '2%'
            }}>
                {showCostCategory ? (
                    <>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            Costo: {CardInfo?.activation_cost}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            Clase: {CardInfo?.category}
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            Cargas:{timesUsed === undefined || CardInfo?.usage == -1 ? `${CardInfo?.usage == -1 ? "∞" : CardInfo?.usage}` : `${(CardInfo?.usage || 0) - timesUsed}/${CardInfo?.usage}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            Tipo: {CardInfo?.type}
                        </Typography>
                    </>
                )}
            </Box>
        </Card>
    );
};
export default PlayCard;