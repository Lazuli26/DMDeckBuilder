import { Card, CardHeader, Typography, CardContent, CardMedia, Box } from "@mui/material";
import { useEffect, useState } from "react";
import "./style.css";
import { rarities } from "@/services/constants";
import { useAppSelector } from "@/store/reduxHooks";
import React from "react";

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

const PlayCard: React.FC<{ CampaignID: string, CardID: string, timesUsed?: number }> = ({ CardID, timesUsed }) => {
    const [showCostCategory, setShowCostCategory] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowCostCategory(prev => !prev);
        }, 3000);

        return () => clearInterval(interval);
    }, []);
    const CardInfo = useAppSelector(state => state.campaign.value?.cards.find(card => card.id == CardID)) || null;

    return (
        <Card
            className="Card animated-card"
            style={{
                border: `10px solid ${rarities[(CardInfo?.rarity || 1)].color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                backgroundImage: `url(${rarities[(CardInfo?.rarity || 1)].background})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: "8% 8%",
                transform: "rotateZ(-1deg)",
                margin: '5px',
                filter: CardInfo?.tags?.find(val => val === 'Malus') ? 'brightness(75%) hue-rotate(180deg)' : 'none',
            }}
        >
            <CardHeader
                sx={{
                    width: "100%",
                    position: 'relative',
                    zIndex: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    marginBottom: '10px',
                    border: `2px solid black`,
                    padding: '2%'
                }}
                title={
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="h5" color="textPrimary" style={responsiveTitleStyle}>
                            {CardInfo?.name}
                        </Typography>
                        <Typography variant="body2" color="textPrimary" style={responsiveTextStyle}>
                            {rarities[(CardInfo?.rarity || 1)].name}
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
                    border: `5px solid grey`,
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
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: `2px solid black`,
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
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: '2px solid black',
                padding: '2%'
            }}>
                {showCostCategory ? (
                    <>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            Costo: {CardInfo?.activation_cost}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" style={responsiveTextStyle}>
                            Tags: #{CardInfo?.tags?.join("#") || "Ninguno"}
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
export default React.memo(PlayCard);