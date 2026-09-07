import emailMapJson from "../../../serviceSampledata/auth/EmailBidCidSampleData.json";

interface IEmailBidCid {
    bid: string;
    cid: string;
    email: string;
}

const emailMap: IEmailBidCid[] = emailMapJson;

const FnGetBidCid = (
    email?: string | null
): { bid: string; cid: string } | undefined => {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (!normalizedEmail) {
        return undefined;
    }

    const match = emailMap.find(
        (item) => item.email.toLowerCase() === normalizedEmail
    );
    if (!match) {
        return undefined;
    }

    return { bid: match.bid, cid: match.cid };
};

export { FnGetBidCid, emailMap };
export type { IEmailBidCid };
