import { doc, getDoc, updateDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from "../firebase";
import { Campaign, Pack } from "../interfaces";
import { getCampaign } from "../firestore";

// ...existing code...

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

// Get all packs from a campaign
export async function getPacks(campaignId: string): Promise<Pack[]> {
    const campaign = await getCampaign(campaignId);
    return campaign ? campaign.packs : [];
}

// Subscribe to packs in a campaign
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

// Get specific pack information
export async function getPackInfo(campaignId: string, packId: string): Promise<Pack | null> {
    const campaign = await getCampaign(campaignId);
    return campaign ? campaign.packs.find(p => p.id === packId) || null : null;
}

// Get pack contents
export async function getPackContents(campaignId: string, packId: string): Promise<{ cardId: string; weight?: number }[]> {
    const campaign = await getCampaign(campaignId);
    const pack = campaign?.packs.find(p => p.id === packId);
    return pack ? pack.cardPool : [];
}

// ...existing code...
