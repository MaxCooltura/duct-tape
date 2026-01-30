export interface Service {
    name: string;
    load(): Promise<void>;
    run(): Promise<void>;
}
