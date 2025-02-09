import { doc, getDoc, updateDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "../firebase";
import { Player, Campaign, PlayerCollection } from "../interfaces";
import { generateUUID } from "../utils";
import { getCampaign } from "../firestore";

// ...existing code...

// Create or update a player in a campaign
export async function upsertPlayer(campaignId: string, player: Player, ID?: string): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) return;

    const players: PlayerCollection = campaignSnap.data().players || {};
    if (ID === undefined) {

        let newID = generateUUID();
        while (players[newID] !== undefined) {
            newID = generateUUID();
        }
        players[newID] = player;
    }
    else if (players[ID] !== undefined) {
        players[ID] = player;
    }
    else {
        throw new Error("Player could not be upserted");
        
    }

    await updateDoc(campaignRef, { players });
}

// Add or remove a card in a player's inventory
export async function modifyPlayerCards(campaignId: string, playerId: string, action: "add" | "remove", cardKey?: string): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const players: PlayerCollection = campaignSnap.data().players || {};
    const player = players[playerId];
    if (!player) return;

    if (action === "add") {
        const newCardKey = generateUUID();
        player.Cards[newCardKey] = { cardId: cardKey!, timesUsed: 0 };
    } else if (action === "remove" && cardKey) {
        delete player.Cards[cardKey];
    }

    await updateDoc(campaignRef, { players });
}

// Increase the amount of uses of a card in a player's inventory
export async function addCardUsage(campaignId: string, playerId: string, cardKey: string, amount: number): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const players: PlayerCollection = campaignSnap.data().players || {};
    const player = players[playerId];
    if (!player) return;

    const card = player.Cards[cardKey];
    if (!card) return;

    card.timesUsed += amount;
    await updateDoc(campaignRef, { players });
}

// Get nested data
export async function getPlayerCards(campaignId: string, playerID: string): Promise<{ [key: string]: { cardId: string; timesUsed: number } }> {
    const campaign = await getCampaign(campaignId);
    const player = Object.keys(campaign?.players || {}).find(p => p === playerID);
    return campaign?.players[player || ""].Cards || {};
}

// Get campaign players
export async function getCampaignPlayers(campaignId: string): Promise<{ [key: string]: Player }> {
    const campaign = await getCampaign(campaignId);
    return campaign ? campaign.players : {};
}

// Subscribe to campaign players
export function subscribeToPlayers(campaignId: string, callback: (players: { [key: string]: Player }) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = docSnap.data() as Campaign;
            callback(campaign.players);
        } else {
            callback({});
        }
    });
}

// ...existing code...
