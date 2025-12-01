export declare class StartCampaignDto {
    campaignId: string;
    type: 'dm' | 'post';
    message: string;
    targets: string[];
    accountId: string;
}
