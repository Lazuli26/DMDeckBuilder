/* eslint-disable react/no-children-prop */
"use client"

import { DMComponent } from "@/Components/DMComponent/DMComponent";
import PlayerComponent from "@/Components/PlayerComponent/PlayerComponent";
import { getCampaignList, getCampaignPlayers, subscribeToCampaign } from "@/services/firestore";
import { Player } from "@/services/interfaces";
import { FormControl, InputLabel, Select, MenuItem, AppBar, Toolbar, Typography, IconButton, Box, Paper, Button, CssBaseline } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import { useState, useEffect } from "react";
import { Provider } from 'react-redux';
import { setCampaign } from '@/store/campaignSlice';
import store from "@/store";
import React from "react";
import { ContextWrapper } from "@/Components/AppContext";
import AuthWrapper, { AuthContext } from "@/Components/AuthWrapper/AuthWrapper";
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // You can change this to 'dark' for dark mode
    primary: {
      main: '#1976d2', // Primary color
    },
    secondary: {
      main: '#dc004e', // Secondary color
    },
    error: {
      main: '#f44336', // Error color
    }, 
    background: {
      default: '#f5f5f5', // Background color
    },
  },
  typography: {
    fontFamily: [
      'Geist',
      'Geist_Mono',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

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
      // Fetch and set the campaign data
      subscribeToCampaign(selectedCampaign, campaign => {
        if (campaign) {
          store.dispatch(setCampaign(campaign));
        }
      });
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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <AuthWrapper>
          <AuthContext.Consumer children={(context) => {
            const { user, logout } = context || {};
            return <>
              <AppBar position="static" sx={{ background: "rgb(73, 33, 19)" }}>
                <Toolbar>
                  <IconButton edge="start" color="inherit" aria-label="home" onClick={clearSelection}>
                    <HomeIcon />
                  </IconButton>
                  
                  <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>
                    Dungeon Master Deck Builder<br/>
                    {user?.displayName}
                  </Typography>
                  {logout && <Button color="error" variant="contained"  onClick={logout}>Logout</Button>}
                </Toolbar>
              </AppBar>
              <Provider store={store}>
                <ContextWrapper>
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
                </ContextWrapper>
              </Provider>
            </>
          }} />
        </AuthWrapper>
      </Box>
    </ThemeProvider>
  );
}
