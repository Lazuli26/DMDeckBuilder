"use client"

import { DMComponent } from "@/Components/DMComponent/DMComponent";
import PlayerComponent from "@/Components/PlayerComponent/PlayerComponent";
import { getCampaignList, getCampaignPlayers } from "@/services/firestore";
import { Player } from "@/services/interfaces";
import { FormControl, InputLabel, Select, MenuItem, AppBar, Toolbar, Typography, IconButton, Box, Paper } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import { useState, useEffect } from "react";

export default function Home() {
  const [campaignList, setcampaignList] = useState<{ id: string, name: string }[]>([])
  const [selectedCampaign, selectCampaign] = useState(typeof window !== "undefined" ? localStorage.getItem("selectedCampaign") || "" : "");
  const [playerList, setPlayerList] = useState<Player[]>([])
  const [selectedPlayer, selectPlayer] = useState<string | null>(typeof window !== "undefined" ? localStorage.getItem("selectedPlayer") : null);

  useEffect(() => {
    getCampaignList().then(data => {
      setcampaignList(data)
    })
  }, []);

  useEffect(() => {
    if (selectedCampaign != "") {
      getCampaignPlayers(selectedCampaign).then(val => {
        setPlayerList(val)
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedCampaign", selectedCampaign);
      }
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (selectedPlayer) {
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedPlayer", selectedPlayer);
      }
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("selectedPlayer");
      }
    }
  }, [selectedPlayer]);

  const clearSelection = () => {
    selectCampaign("");
    selectPlayer(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedCampaign");
      localStorage.removeItem("selectedPlayer");
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" sx={{ background: "rgb(73, 33, 19)" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="home" onClick={clearSelection}>
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Dungeon Master Deck Builder
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper sx={{ width: "100%", background: "rgb(166, 166, 166)", overflow: "auto", height: "100%", maxHeight: "100%", padding: "1rem" }}>
        {!selectedPlayer &&
          <FormControl fullWidth>
            <InputLabel id="campaign-selector-label">Select a campaign</InputLabel>
            <Select
              labelId="campaign-selector-label"
              id="campaign-selector"
              value={selectedCampaign}
              label="Select a campaign"
              onChange={e => {
                selectCampaign(e.target.value);
                selectPlayer(null);
              }}
            >
              {campaignList.map((v, i) => <MenuItem key={i} value={v.id}>{v.name}</MenuItem>)}
            </Select>
          </FormControl>
        }
        {selectedCampaign && !selectedPlayer &&
          <FormControl fullWidth>
            <InputLabel id="player-selector-label">Select a player</InputLabel>
            <Select
              labelId="player-selector-label"
              id="player-selector"
              value={selectedPlayer || ""}
              label="Select a player"
              onChange={e => selectPlayer(e.target.value)}
            ><MenuItem value={"DM"}>DM</MenuItem>
              {playerList.map((v, i) => <MenuItem key={i} value={v.id}>{v.name}</MenuItem>)}
            </Select>
          </FormControl>}
        {selectedPlayer == "DM" ? <DMComponent CampaignID={selectedCampaign} /> : selectedPlayer && <PlayerComponent CampaignID={selectedCampaign} PlayerID={selectedPlayer} />}
      </Paper>
    </Box>
  );
}
