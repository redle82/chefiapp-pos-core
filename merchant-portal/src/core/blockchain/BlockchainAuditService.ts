/**
 * P6-1: Blockchain Audit Trail Service
 * 
 * Serviço para audit trail baseado em blockchain
 */

import { Logger } from '../logger/Logger';

export interface BlockchainBlock {
    index: number;
    timestamp: number;
    data: any;
    previousHash: string;
    hash: string;
    nonce: number;
}

class BlockchainAuditService {
    private chain: BlockchainBlock[] = [];
    private difficulty = 2; // Number of leading zeros required

    constructor() {
        // Create genesis block
        this.createGenesisBlock();
    }

    /**
     * Create genesis block
     */
    private createGenesisBlock(): void {
        const genesisBlock: BlockchainBlock = {
            index: 0,
            timestamp: Date.now(),
            data: { message: 'Genesis Block' },
            previousHash: '0',
            hash: '',
            nonce: 0,
        };

        genesisBlock.hash = this.calculateHash(genesisBlock);
        this.chain.push(genesisBlock);
    }

    /**
     * Calculate hash for block
     */
    private calculateHash(block: BlockchainBlock): string {
        const dataString = JSON.stringify(block.data) + block.previousHash + block.index + block.timestamp + block.nonce;
        // Simple hash function (in production, use SHA-256)
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(64, '0');
    }

    /**
     * Mine block (proof of work)
     */
    private mineBlock(block: BlockchainBlock): BlockchainBlock {
        const target = '0'.repeat(this.difficulty);
        
        while (block.hash.substring(0, this.difficulty) !== target) {
            block.nonce++;
            block.hash = this.calculateHash(block);
        }

        return block;
    }

    /**
     * Add audit event to blockchain
     */
    addAuditEvent(data: any): BlockchainBlock {
        const previousBlock = this.chain[this.chain.length - 1];
        const newBlock: BlockchainBlock = {
            index: previousBlock.index + 1,
            timestamp: Date.now(),
            data,
            previousHash: previousBlock.hash,
            hash: '',
            nonce: 0,
        };

        // Mine block
        const minedBlock = this.mineBlock(newBlock);
        this.chain.push(minedBlock);

        Logger.info('Block added to blockchain', {
            index: minedBlock.index,
            hash: minedBlock.hash,
        });

        return minedBlock;
    }

    /**
     * Verify blockchain integrity
     */
    verifyChain(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if current block's previous hash matches previous block's hash
            if (currentBlock.previousHash !== previousBlock.hash) {
                errors.push(`Block ${i}: Previous hash mismatch`);
            }

            // Check if current block's hash is valid
            const calculatedHash = this.calculateHash(currentBlock);
            if (currentBlock.hash !== calculatedHash) {
                errors.push(`Block ${i}: Hash mismatch`);
            }

            // Check proof of work
            const target = '0'.repeat(this.difficulty);
            if (currentBlock.hash.substring(0, this.difficulty) !== target) {
                errors.push(`Block ${i}: Invalid proof of work`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Get blockchain
     */
    getChain(): BlockchainBlock[] {
        return [...this.chain];
    }

    /**
     * Get latest block
     */
    getLatestBlock(): BlockchainBlock {
        return this.chain[this.chain.length - 1];
    }
}

export const blockchainAuditService = new BlockchainAuditService();
