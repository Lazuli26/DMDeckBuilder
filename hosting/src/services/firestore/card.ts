import { doc, getDoc, updateDoc, onSnapshot, Unsubscribe, collection } from "firebase/firestore";
import { db } from "../firebase";
import { Campaign, PlayingCard } from "../interfaces";
import { getCampaign } from "../firestore";

// ...existing code...

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

// ...existing code...
