export declare class CreateCampaignDto {
    name: string;
    type: 'dm' | 'post';
    message: string;
    targets: string[];
    accountId: string;
}
