import { CoreEvent, EventStore } from "../event-log/types";
import { Projection, ProjectionManager } from "./types";
import { FailpointInjector } from "../tests/harness/FailpointInjector";

export class StandardProjectionManager implements ProjectionManager {
    private projections: Projection[] = [];

    constructor(private eventStore: EventStore) { }

    register(projection: Projection): void {
        this.projections.push(projection);
    }

    async handleEvent(event: CoreEvent): Promise<void> {
        // Failpoint: simular falha antes de atualizar projeções
        await FailpointInjector.getInstance().checkpoint('ProjectionManager.handleEvent.before');
        
        // Parallel execution for speed, assuming independent projections
        // Error handling: If one fails, we log but continue others? 
        // Or fail the batch? For now, we propagate error to ensure visibility.
        await Promise.all(this.projections.map(p => p.handle(event)));
        
        // Failpoint: simular falha após atualizar projeções
        await FailpointInjector.getInstance().checkpoint('ProjectionManager.handleEvent.after');
    }

    async replayAll(): Promise<void> {
        // 1. Reset all projections
        console.log("Resetting all projections...");
        await Promise.all(this.projections.map(p => p.reset()));

        // 2. Read all events
        // Optimization: In real world, use cursor/pagination. 
        // Here, assuming fit-in-memory or reasonable size for V1.
        console.log("Reading full event stream...");
        const events = await this.eventStore.readAll();

        // 3. Apply events
        console.log(`Replaying ${events.length} events...`);
        for (const event of events) {
            await this.handleEvent(event);
        }
        console.log("Replay complete.");
    }
}
