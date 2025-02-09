import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, Unsubscribe, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Campaign, Player, ShopItem} from "../interfaces";
import { generateUUID } from "../utils";
import _ from "lodash";
// ...existing code...

const formatCampaign = (Campaign: Campaign, ID: string) => {
    if(_.isArray(Campaign.players)){
        const playerObject: {[key: string]: Player} = {}
        Campaign.players.forEach(player => {
            playerObject[player.id] = player
        })
        Campaign = {...Campaign, players: playerObject}
        updateDoc(doc(db, "campaigns", ID), {players: playerObject})
    }
    return Campaign
}

export async function createCampaign(name: string): Promise<string> {
    const campaignRef = await addDoc(collection(db, "campaigns"), {
        name,
        players: {},
        cards: [],
        packs: [],
        characters: {}
    } as Campaign);
    return campaignRef.id;
}

// Get all campaigns
export async function getCampaigns(): Promise<Campaign[]> {
    const campaignsSnap = await getDocs(collection(db, "campaigns"));
    return campaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as unknown as Campaign }));
}

// Get campaign names and IDs
export async function getCampaignList(): Promise<{ id: string; name: string }[]> {
    const campaignsSnap = await getDocs(collection(db, "campaigns"));
    return campaignsSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
}

// Get a specific campaign
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    return campaignSnap.exists() ? (campaignSnap.data() as Campaign) : null;
}

// Subscribe to campaign
export function subscribeToCampaign(campaignId: string, callback: (Campaign: Campaign | null) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = formatCampaign(docSnap.data() as Campaign, campaignId);
            callback(campaign);
        } else {
            callback(null);
        }
    });
}

// Set or clear the cardShowcase property of a campaign
export async function setCardShowcase(campaignId: string, cardIds: string[] = []): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    await updateDoc(campaignRef, { cardShowcase: cardIds });
}

export const modifyShop = async (campaignID: string, action: { type: "add" | "update" | "remove", payload?: ShopItem, key?: string }) => {
    const campaignRef = doc(db, "campaigns", campaignID);
    const campaignDoc = await getDoc(campaignRef);
    const campaign = campaignDoc.data() as Campaign;
    const shop = campaign?.shop || {};

    if (action.type === "add" && action.payload?.price !== undefined) {
        const newUUID = generateUUID();
        shop[newUUID] = action.payload;
        await updateDoc(campaignRef, { shop });
    } else if (action.type === "remove" && action.key !== undefined) {
        delete shop[action.key];
        await updateDoc(campaignRef, { shop });
    } else if (action.type === "update" && action.payload !== undefined && action.key !== undefined) {
        shop[action.key] = { ...shop[action.key], ...action.payload };
        await updateDoc(campaignRef, { shop });
    }
};

// ...existing code...
