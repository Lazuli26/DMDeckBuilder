import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, Unsubscribe, updateDoc } from "firebase/firestore"
import { db } from "./firebase";
import { Campaign, Player, PlayingCard, Pack, ShopItem } from "./interfaces";
import { generateUUID } from "./utils";

export function getDocument<T>(collectionName: string, documentName: string, callback: (dato: T | undefined) => void): Unsubscribe {
    return onSnapshot(
        doc(collection(db, collectionName), documentName),
        (result) => {
            console.log(result.exists() && result.data())
            callback(result.data() as T | undefined)
        }
    )
}

export async function createCampaign(name: string): Promise<string> {
    const campaignRef = await addDoc(collection(db, "campaigns"), {
        name,
        players: [],
        cards: [],
        packs: []
    } as Campaign);
    return campaignRef.id;
}

// Create or update a player in a campaign
export async function upsertPlayer(campaignId: string, player: Player): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) return;

    const players: Player[] = campaignSnap.data().players || [];
    const existingIndex = players.findIndex(p => p.id === player.id);

    if (existingIndex > -1) {
        players[existingIndex] = player;
    } else {
        player.id = generateUUID();
        players.push(player);
    }

    await updateDoc(campaignRef, { players });
}

// Add or edit a card in a campaign
export async function upsertCard(campaignId: string, card: PlayingCard): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const cards: Campaign["cards"] = campaignSnap.data().cards || [];

    // Check for duplicate names
    const cardIndex = cards.findIndex(val => val.id == card.id)
    if (cardIndex != -1) {
        cards[cardIndex] = card
    }
    else {
        cards.forEach(c => {
            if (c.name === card.name) {
                throw new Error("Card with this name already exists.");
            }
        })
        cards.push(card);
    }

    await updateDoc(campaignRef, { cards });
}

// Remove a card from a campaign
export async function removeCard(campaignId: string, cardId: string): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const cards: Campaign["cards"] = campaignSnap.data().cards || [];
    const updatedCards = cards.filter(card => card.id !== cardId);

    await updateDoc(campaignRef, { cards: updatedCards });
}

// Add or edit a pack in a campaign
export async function upsertPack(campaignId: string, pack: Pack): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const packs: Pack[] = campaignSnap.data().packs || [];

    if (packs.some(p => p.name === pack.name && p.id !== pack.id)) {
        throw new Error("Pack with this name already exists.");
    }

    const existingIndex = packs.findIndex(p => p.id === pack.id);
    if (existingIndex > -1) {
        packs[existingIndex] = pack;
    } else {
        packs.push(pack);
    }

    await updateDoc(campaignRef, { packs });
}

// Add or remove card ID in a pack
export async function modifyPackContents(campaignId: string, packId: string, cardId: string, action: "add" | "remove"): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const packs: Pack[] = campaignSnap.data().packs || [];
    const pack = packs.find(p => p.id === packId);
    if (!pack) return;

    if (action === "add" && pack.cardPool.some(c => c.cardId === cardId)) {
        throw new Error("Card is already in the pack.");
    }

    pack.cardPool = action === "add"
        ? [...pack.cardPool, { cardId, weight: 1 }]
        : pack.cardPool.filter(c => c.cardId !== cardId);

    await updateDoc(campaignRef, { packs });
}

// Add or remove a card in a player's inventory
export async function modifyPlayerCards(campaignId: string, playerId: string, action: "add" | "remove", cardKey?: string): Promise<void> {
    const campaignRef = doc(db, "campaigns", campaignId);
    const campaignSnap = await getDoc(campaignRef);
    if (!campaignSnap.exists()) return;

    const players: Player[] = campaignSnap.data().players || [];
    const player = players.find(p => p.id === playerId);
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

    const players: Player[] = campaignSnap.data().players || [];
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const card = player.Cards[cardKey];
    if (!card) return;

    card.timesUsed += amount;
    await updateDoc(campaignRef, { players });
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

// Get all packs from a campaign
export async function getPacks(campaignId: string): Promise<Pack[]> {
    const campaign = await getCampaign(campaignId);
    return campaign ? campaign.packs : [];
}
export function subscribeToPacks(campaignId: string, callback: (data: Pack[]) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = docSnap.data() as Campaign;
            callback(campaign.packs);
        } else {
            callback([]);
        }
    });

}
export function subscribeToCardShowCase(campaignId: string, callback: (data: Campaign["cardShowcase"]) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = docSnap.data() as Campaign;
            callback(campaign.cardShowcase);
        } else {
            callback([]);
        }
    });

}

// Get all cards from a campaign
export function getCards(campaignId: string, callback: (data: PlayingCard[]) => void): Unsubscribe {
    return onSnapshot(
        doc(collection(db, "campaigns"), campaignId), res => {
            if (res.exists())
                callback((res.data() as Campaign).cards)
        });
}

// Get specific card information
export async function getCardInfo(campaignId: string, cardId: string): Promise<PlayingCard | null> {
    const campaign = await getCampaign(campaignId);
    return campaign ? (campaign.cards.find(c => c.id == cardId) || null) : null;
}
// Subscribe to cards in a campaign
export function subscribeToCards(campaignId: string, callback: (cards: PlayingCard[]) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = docSnap.data() as Campaign;
            callback(Object.values(campaign.cards));
        } else {
            callback([]);
        }
    });
}

// Subscribe to a specific card
export function subscribeToCard(campaignId: string, cardId: string, callback: (card: PlayingCard | null) => void): Unsubscribe {
    return subscribeToCards(campaignId, (cards) => {
        callback(cards.find(card => card.id === cardId) || null);
    });
}

// Get specific pack information
export async function getPackInfo(campaignId: string, packId: string): Promise<Pack | null> {
    const campaign = await getCampaign(campaignId);
    return campaign ? campaign.packs.find(p => p.id === packId) || null : null;
}

// Get nested data
export async function getPlayerCards(campaignId: string, playerID: string): Promise<{ [key: string]: { cardId: string; timesUsed: number } }> {
    const campaign = await getCampaign(campaignId);
    const player = campaign?.players.find(p => p.id === playerID);
    return player ? player.Cards : {};
}

export async function getPackContents(campaignId: string, packId: string): Promise<{ cardId: string; weight?: number }[]> {
    const campaign = await getCampaign(campaignId);
    const pack = campaign?.packs.find(p => p.id === packId);
    return pack ? pack.cardPool : [];
}

export async function getCampaignPlayers(campaignId: string): Promise<Player[]> {
    const campaign = await getCampaign(campaignId);
    return campaign ? campaign.players : [];
}

// Subscribe to campaign players
export function subscribeToPlayers(campaignId: string, callback: (players: Player[]) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = docSnap.data() as Campaign;
            callback(campaign.players);
        } else {
            callback([]);
        }
    });
}
// Subscribe to campaign
export function subscribeToCampaign(campaignId: string, callback: (Campaign: Campaign | null) => void): Unsubscribe {
    return onSnapshot(doc(db, "campaigns", campaignId), (docSnap) => {
        if (docSnap.exists()) {
            const campaign = docSnap.data() as Campaign;
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