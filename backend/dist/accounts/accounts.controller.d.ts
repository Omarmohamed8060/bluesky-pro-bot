import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
export declare class AccountsController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    create(createAccountDto: CreateAccountDto): Promise<{
        id: string;
        username: string;
        did: string | null;
        isActive: boolean;
        createdAt: string;
        lastUsedAt: string | null;
    }>;
    findAll(): Promise<{
        id: any;
        username: any;
        did: any;
        isActive: boolean;
        createdAt: any;
        lastUsedAt: any;
    }[]>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
